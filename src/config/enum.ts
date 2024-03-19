/**
 * Represents the side of an equation.
 */
export enum Side {
    LONG = 1,
    SHORT = 2
}

/**
 * Flips the side of an equation.
 * @param side The original side of the equation.
 * @returns The flipped side of the equation.
 */
export const SideFlip = (side: Side) => side === Side.LONG ? Side.SHORT : Side.LONG;

export enum Order_Status {
	Created = 'CREATED',
	Executed = 'EXECUTED',
	Cancelled = 'CANCELLED'
}