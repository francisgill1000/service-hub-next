export const generateDates = (numDays = 31) => {
    const dates = [];
    const today = new Date();

    for (let i = 0; i < numDays; i++) {
        const date = new Date();
        date.setDate(today.getDate() + i);
        dates.push(date);
    }

    return dates;
};