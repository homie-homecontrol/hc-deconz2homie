export const MILLISECONDS_IN_DAY = 86400000;


export function dateToDays(date: number): number {
    return Math.floor(date / MILLISECONDS_IN_DAY);
}

export function nowToDays(): number {
    return this.dateToDays(Date.now());
}

export function getMonday(d) {
    d = new Date(d);
    var day = d.getDay(),
        diff = d.getDate() - day + (day == 0 ? -6 : 1); // adjust when day is sunday
    return new Date(d.setDate(diff));
}

export function getStartOfDay(date: number): number {
    const d = new Date(date);

    return d.setHours(0,0,0,0)
}

export function getEndOfDay(date: number): number {
    const d = new Date(date);

    return d.setHours(23,59,59,999);
}

export function getUID(context: any): string {
    return context?.user?.federated_claims?.user_id
}
