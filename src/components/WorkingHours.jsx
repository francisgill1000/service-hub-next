export default function WorkingHours({ working_hours = [] }) {

    return (
        <>
            <h2 className="text-lg font-bold mb-4">Working Hours</h2>
            <div className="space-y-4">

                {working_hours.length > 0 ? working_hours.map((hour, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                        <span className="text-navy-muted">{hour.day}</span>
                        <span className="font-medium text-white">{hour.start_time} - {hour.end_time}</span>
                    </div>
                )) : "No Working Hours Available"}

            </div>
        </>
    );
}