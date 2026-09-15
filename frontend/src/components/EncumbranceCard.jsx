/**
 * EncumbranceCard Component for Land Stack GIS
 * Displays Bank Mortgages, Legal Disputes, and Clear Title Certifications (NEC)
 *
 * Props:
 * - encumbrance: object containing status, mortgageDetails, legalDispute, certificate
 */
function EncumbranceCard({ encumbrance }) {
  if (!encumbrance) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="mb-2 font-bold text-slate-900">Encumbrance & Legal Status</h3>
        <p className="text-xs text-slate-400 italic">No encumbrance records on file.</p>
      </section>
    );
  }

  const {
    status = "Freehold - No Active Liens",
    mortgageDetails = {},
    legalDispute = {},
    certificate = {}
  } = encumbrance;

  const isMortgaged = mortgageDetails.isMortgaged;
  const hasDispute = legalDispute.hasDispute;

  // Determine overall status badge color
  const getBadgeStyle = () => {
    if (hasDispute) {
      return {
        badge: "bg-red-100 text-red-800 ring-1 ring-red-300",
        dot: "bg-red-500",
        text: "Litigation Alert",
        border: "border-red-200 bg-red-50/40"
      };
    }
    if (isMortgaged) {
      return {
        badge: "bg-amber-100 text-amber-800 ring-1 ring-amber-300",
        dot: "bg-amber-500",
        text: "Bank Mortgage Active",
        border: "border-amber-200 bg-amber-50/30"
      };
    }
    return {
      badge: "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300",
      dot: "bg-emerald-500",
      text: "Clear Title (Freehold)",
      border: "border-slate-200 bg-white"
    };
  };

  const currentTheme = getBadgeStyle();

  return (
    <section className={`rounded-xl border p-4 shadow-sm transition ${currentTheme.border}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Encumbrance & Legal Status
            </span>
          </div>
          <p className="mt-0.5 text-[11px] text-slate-500">
            Sub-Registrar Non-Encumbrance Search (Form 15)
          </p>
        </div>

        {/* Primary Status Badge */}
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${currentTheme.badge}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${currentTheme.dot}`} />
          {currentTheme.text}
        </span>
      </div>

      {/* Main Status Text */}
      <div className="mt-3 flex items-center justify-between border-b border-slate-100 py-2.5">
        <span className="text-xs text-slate-500">Tenure / Title Nature</span>
        <span className="text-xs font-bold text-slate-800">{status}</span>
      </div>

      {/* Bank Mortgage Section */}
      <div className="border-b border-slate-100 py-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">Institutional Lien / Mortgage</span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
              isMortgaged
                ? "bg-amber-100 text-amber-800"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {isMortgaged ? "Active Lien" : "No Lien"}
          </span>
        </div>

        {isMortgaged ? (
          <div className="mt-2 rounded-lg bg-white/90 p-2.5 text-xs ring-1 ring-amber-200 space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Financier:</span>
              <span className="font-bold text-slate-900">{mortgageDetails.bankName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Loan Reference:</span>
              <span className="font-mono text-[11px] font-semibold text-blue-700">
                {mortgageDetails.loanId}
              </span>
            </div>
            {mortgageDetails.sanctionedAmount && (
              <div className="flex justify-between">
                <span className="text-slate-500">Lien Amount:</span>
                <span className="font-bold text-amber-900">{mortgageDetails.sanctionedAmount}</span>
              </div>
            )}
          </div>
        ) : (
          mortgageDetails.bankName && mortgageDetails.bankName !== "None" && (
            <p className="mt-1 text-[11px] text-slate-500 italic">
              {mortgageDetails.bankName}
            </p>
          )
        )}
      </div>

      {/* Legal Disputes / Litigation Section */}
      <div className="border-b border-slate-100 py-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">Judicial / Dispute Status</span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
              hasDispute
                ? "bg-red-100 text-red-800"
                : "bg-emerald-100 text-emerald-700"
            }`}
          >
            {hasDispute ? "Litigation Pending" : "Dispute Free"}
          </span>
        </div>

        {hasDispute ? (
          <div className="mt-2 rounded-lg bg-white/90 p-2.5 text-xs ring-1 ring-red-200 space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Suit Type:</span>
              <span className="font-bold text-red-900">{legalDispute.status}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Court Case:</span>
              <span className="font-mono text-[11px] font-semibold text-slate-800">
                {legalDispute.courtCaseId}
              </span>
            </div>
            {legalDispute.remarks && (
              <p className="mt-1 text-[11px] text-red-700 leading-tight">
                ⚠️ {legalDispute.remarks}
              </p>
            )}
          </div>
        ) : (
          <p className="mt-1 text-[11px] text-slate-500">
            {legalDispute.remarks || "No pending civil or revenue court stays."}
          </p>
        )}
      </div>

      {/* Non-Encumbrance Certificate (NEC) Verification */}
      <div className="pt-2.5">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500">Digital Certificate</span>
            <p className="font-mono text-[11px] font-bold text-blue-700">
              {certificate.necNumber || "NEC-VERIFIED"}
            </p>
          </div>
          <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
            {certificate.validity || "30-Year Clear"}
          </span>
        </div>
      </div>
    </section>
  );
}

export default EncumbranceCard;
