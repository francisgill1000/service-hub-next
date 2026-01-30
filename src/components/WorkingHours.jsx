export default function WorkingHours() {
    return (
        <>
            <h2 className="text-lg font-bold mb-4">Working Hours</h2>
            <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                    <span className="text-navy-muted">Monday</span>
                    <span className="font-medium text-white">9:00 AM - 9:00 PM</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                    <span className="text-navy-muted">Tuesday</span>
                    <span className="font-medium text-white">9:00 AM - 9:00 PM</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                    <span className="text-navy-muted">Wednesday</span>
                    <span className="font-medium text-white">9:00 AM - 9:00 PM</span>
                </div>

                <div className="flex justify-between items-center text-sm">
                    <span className="text-navy-muted">Thursday</span>
                    <span className="font-medium text-white">9:00 AM - 9:00 PM</span>
                </div>

                <div className="flex justify-between items-center text-sm">
                    <span className="text-navy-muted">Friday</span>
                    <span className="font-medium text-white">9:00 AM - 9:00 PM</span>
                </div>

                <div className="flex justify-between items-center text-sm">
                    <span className="text-navy-muted">Saturday</span>
                    <span className="font-medium text-white">9:00 AM - 9:00 PM</span>
                </div>

                <div className="flex justify-between items-center text-sm">
                    <span className="text-navy-muted">Sunday</span>
                    <span className="font-medium text-white">9:00 AM - 9:00 PM</span>
                </div>
            </div>
        </>
    );
}