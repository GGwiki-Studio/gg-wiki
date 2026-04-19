const CardSkeleton = ({ count = 5, imageHeight = 'h-44' }: { count?: number; imageHeight?: string }) => {
    return (
        <>
            {[...Array(count)].map((_, i) => (
                <div key={i} className="animate-pulse rounded-lg overflow-hidden border border-[#353535]">
                    <div className={`bg-[#333] ${imageHeight}`}></div>
                    <div className="bg-[#2a2a2a] p-3 space-y-2">
                        <div className="h-4 bg-[#3a3a3a] rounded w-3/4"></div>
                        <div className="h-3 bg-[#3a3a3a] rounded w-1/2"></div>
                    </div>
                </div>
            ))}
        </>
    )
}

export default CardSkeleton