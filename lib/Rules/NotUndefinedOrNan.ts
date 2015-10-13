import {IRule} from '../IRule';

export class NotUndefinedOrNan implements IRule {
    /**
     * Value is valid when not undefined or NaN.
     * @param value Value to ckeck
     * @returns {boolean} True if valid, false otherwise
     */
    isValueValid(value:any):boolean {
        return value !== undefined && value === value;
    }
}