-- Migration to add razorpay_customer_id to profiles for vaulted cards

ALTER TABLE profiles
ADD COLUMN razorpay_customer_id TEXT;
