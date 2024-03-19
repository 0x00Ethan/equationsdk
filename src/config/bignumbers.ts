import Decimal from 'decimal.js';

export const Q1 = new Decimal(2).pow(1);
export const Q32 = new Decimal(2).pow(32);
export const Q64 = new Decimal(2).pow(64);
export const Q96 = '79228162514264337593543950336';

export const BASIS_POINTS_DIVISOR = 100000000;
export const BASIS_POINTS_DIVISOR_BIGINT = 100_000_000n;
export const REFERRAL_MULTIPLIER_BIGINT = 110_000_000n;

export const REWARD_CAP: bigint = 10_000_000n * 10n ** 18n;
export const Q64_BIGINT = 1n << 64n;
export const Q96_BIGINT = 1n << 96n;