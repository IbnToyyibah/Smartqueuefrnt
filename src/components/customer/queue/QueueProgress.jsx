export default function QueueProgress({ current, total }) {
    return (
        <div className="flex items-center gap-2 mb-7">
            {Array.from({ length: total }).map((_, index) => (
                <div key={index} className="flex-1">
                    <div className={`h-2 rounded-full transition-colors duration-200 ${index <= current ? 'bg-violet-600' : 'bg-slate-200'}`} />
                </div>
            ))}
        </div>
    )
}
