<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\Employee;
use App\Models\Subscription;
use App\Models\Transaction;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class TransactionService
{
    /**
     * Record a new subscription purchase.
     * 
     * @param Customer $customer
     * @param Employee $employee
     * @param array $subscriptionData
     * @return array ['subscription' => Subscription, 'transaction' => Transaction]
     */
    public function recordNewSubscription(Customer $customer, Employee $employee, array $subscriptionData)
    {
        return DB::transaction(function () use ($customer, $employee, $subscriptionData) {
            // Create the subscription
            $subscription = Subscription::create([
                'customer_id' => $customer->id,
                'employee_id' => $employee->id,
                'plan_name' => $subscriptionData['plan_name'],
                'amount' => $subscriptionData['amount'],
                'start_date' => $subscriptionData['start_date'] ?? now(),
                'end_date' => $subscriptionData['end_date'],
                'status' => Subscription::STATUS_ACTIVE,
            ]);

            // Record the financial transaction (IMMUTABLE)
            $transaction = Transaction::create([
                'customer_id' => $customer->id,
                'employee_id' => $employee->id,
                'subscription_id' => $subscription->id,
                'amount' => $subscriptionData['amount'],
                'payment_type' => Transaction::TYPE_NEW,
                'payment_date' => $subscriptionData['payment_date'] ?? now(),
                'description' => "New subscription: {$subscriptionData['plan_name']}",
                'metadata' => [
                    'plan_name' => $subscriptionData['plan_name'],
                    'payment_method' => $subscriptionData['payment_method'] ?? null,
                ],
            ]);

            return [
                'subscription' => $subscription,
                'transaction' => $transaction,
            ];
        });
    }

    /**
     * Renew an existing subscription.
     * 
     * CRITICAL: This creates a NEW transaction record.
     * Historical transactions are NEVER modified.
     * 
     * @param Subscription $subscription
     * @param array $renewalData
     * @return array ['subscription' => Subscription, 'transaction' => Transaction]
     */
    public function renewSubscription(Subscription $subscription, array $renewalData = [])
    {
        return DB::transaction(function () use ($subscription, $renewalData) {
            // Determine renewal amount (can be different from original)
            $renewalAmount = $renewalData['amount'] ?? $subscription->amount;
            $renewalPeriod = $renewalData['period_months'] ?? 1;

            // Update the subscription's end date (current state only)
            $newEndDate = $subscription->end_date->addMonths($renewalPeriod);

            $subscription->update([
                'end_date' => $newEndDate,
                'amount' => $renewalAmount, // Current subscription amount
                'status' => Subscription::STATUS_ACTIVE,
            ]);

            // Record the RENEWAL as a NEW transaction (IMMUTABLE)
            $transaction = Transaction::create([
                'customer_id' => $subscription->customer_id,
                'employee_id' => $subscription->employee_id,
                'subscription_id' => $subscription->id,
                'amount' => $renewalAmount,
                'payment_type' => Transaction::TYPE_RENEWAL,
                'payment_date' => $renewalData['payment_date'] ?? now(),
                'description' => "Renewal: {$subscription->plan_name}",
                'metadata' => [
                    'plan_name' => $subscription->plan_name,
                    'period_months' => $renewalPeriod,
                    'previous_end_date' => $subscription->end_date->subMonths($renewalPeriod)->toDateString(),
                    'new_end_date' => $newEndDate->toDateString(),
                    'payment_method' => $renewalData['payment_method'] ?? null,
                ],
            ]);

            return [
                'subscription' => $subscription->fresh(),
                'transaction' => $transaction,
            ];
        });
    }

    /**
     * Upgrade a subscription.
     * 
     * @param Subscription $subscription
     * @param array $upgradeData
     * @return array
     */
    public function upgradeSubscription(Subscription $subscription, array $upgradeData)
    {
        return DB::transaction(function () use ($subscription, $upgradeData) {
            $upgradeDifference = $upgradeData['new_amount'] - $subscription->amount;

            // Update subscription to new plan
            $subscription->update([
                'plan_name' => $upgradeData['plan_name'],
                'amount' => $upgradeData['new_amount'],
            ]);

            // Record upgrade transaction
            $transaction = Transaction::create([
                'customer_id' => $subscription->customer_id,
                'employee_id' => $subscription->employee_id,
                'subscription_id' => $subscription->id,
                'amount' => $upgradeDifference, // Only the difference
                'payment_type' => Transaction::TYPE_UPGRADE,
                'payment_date' => $upgradeData['payment_date'] ?? now(),
                'description' => "Upgrade to: {$upgradeData['plan_name']}",
                'metadata' => [
                    'old_plan' => $subscription->plan_name,
                    'new_plan' => $upgradeData['plan_name'],
                    'old_amount' => $subscription->amount,
                    'new_amount' => $upgradeData['new_amount'],
                ],
            ]);

            return [
                'subscription' => $subscription->fresh(),
                'transaction' => $transaction,
            ];
        });
    }

    /**
     * Issue a refund.
     * 
     * @param Subscription $subscription
     * @param float $refundAmount
     * @param string $reason
     * @return Transaction
     */
    public function issueRefund(Subscription $subscription, float $refundAmount, string $reason = '')
    {
        return DB::transaction(function () use ($subscription, $refundAmount, $reason) {
            // Record refund as a negative transaction
            $transaction = Transaction::create([
                'customer_id' => $subscription->customer_id,
                'employee_id' => $subscription->employee_id,
                'subscription_id' => $subscription->id,
                'amount' => -abs($refundAmount), // Ensure negative
                'payment_type' => Transaction::TYPE_REFUND,
                'payment_date' => now(),
                'description' => "Refund: {$reason}",
                'metadata' => [
                    'reason' => $reason,
                    'original_subscription' => $subscription->plan_name,
                ],
            ]);

            return $transaction;
        });
    }

    /**
     * Record a manual adjustment.
     * 
     * @param Customer $customer
     * @param Employee $employee
     * @param float $amount
     * @param string $reason
     * @return Transaction
     */
    public function recordAdjustment(Customer $customer, Employee $employee, float $amount, string $reason)
    {
        return Transaction::create([
            'customer_id' => $customer->id,
            'employee_id' => $employee->id,
            'subscription_id' => null,
            'amount' => $amount,
            'payment_type' => Transaction::TYPE_ADJUSTMENT,
            'payment_date' => now(),
            'description' => "Adjustment: {$reason}",
            'metadata' => [
                'reason' => $reason,
            ],
        ]);
    }

    /**
     * Safely delete a customer (soft delete).
     * Preserves all financial transaction history.
     * 
     * @param Customer $customer
     * @return bool
     */
    public function deleteCustomer(Customer $customer): bool
    {
        return DB::transaction(function () use ($customer) {
            // Soft delete subscriptions first
            $customer->subscriptions()->delete();

            // Soft delete customer
            // Transactions remain intact due to model constraints
            return $customer->delete();
        });
    }
}
