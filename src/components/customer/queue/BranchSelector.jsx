import { MdBusiness, MdCheckCircle, MdLocationOn } from 'react-icons/md'

export default function BranchSelector({ branches, selectedBranchId, loading, error, onSelect, isBranchDisabled, renderStatus }) {
  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return <p className="text-sm text-red-500">{error}</p>
  }

  if (!branches.length) {
    return <p className="text-sm text-slate-500">No branches available. Please refresh or try again later.</p>
  }

  return (
    <div className="flex flex-col gap-3">
      {branches.map((branch) => {
        const isSelected = selectedBranchId === branch._id
        const disabled = Boolean(isBranchDisabled?.(branch))
        return (
          <button
            key={branch._id}
            type="button"
            onClick={() => !disabled && onSelect(branch._id)}
            className={`flex items-start gap-4 p-4 rounded-2xl border-2 text-left transition-all ${isSelected ? 'border-violet-500 bg-violet-50 ring-2 ring-violet-200' : 'border-slate-200 hover:border-slate-300'} ${disabled ? 'opacity-70 cursor-not-allowed' : ''}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isSelected ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
              <MdBusiness size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-slate-800 text-sm truncate">{branch.name}</p>
                {disabled && renderStatus && (
                  <span className="text-[10px] font-bold bg-red-100 text-red-500 px-1.5 py-0.5 rounded-full border border-red-200 shrink-0">
                    {renderStatus(branch)}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                <MdLocationOn size={11} />
                {branch.address || branch.city || 'Location not provided'}
              </p>
            </div>
            {isSelected && !disabled && <MdCheckCircle size={20} className="text-violet-600 shrink-0 mt-0.5" />}
            </button>
          )
        })}
        </div>
    )
}
