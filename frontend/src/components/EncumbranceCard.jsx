import StatusPill from "./StatusPill";

/**
 * EncumbranceCard Component for Land Stack GIS (SpaceX Stark Theme)
 * Displays Bank Mortgages, Legal Disputes, and Clear Title Certifications (NEC)
 *
 * Props:
 * - encumbrance: object containing status, mortgageDetails, legalDispute, certificate
 */
function EncumbranceCard({ encumbrance }) {
  if (!encumbrance) {
    return (
      <section className="rounded-none border border-gray-200 dark:border-neutral-800 bg-white dark:bg-[#050505] p-4">
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white">
          Encumbrance & Legal Status
        </h3>
        <p className="text-xs text-gray-400 italic">No encumbrance records on file.</p>
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

  // Determine overall status badge color with stark borders
  const getBadgeStyle = () => {
    if (hasDispute) {
      return {
        text: "Litigation Alert",
        statusLabel: "Litigation Pending",
        border: "border-red-500/40 dark:border-red-500/40 bg-white dark:bg-[#050505]"
      };
    }
    if (isMortgaged) {
      return {
        text: "Bank Mortgage Active",
        statusLabel: "Active Lien",
        border: "border-amber-500/40 dark:border-amber-500/40 bg-white dark:bg-[#050505]"
      };
    }
    return {
      text: "Clear Title (Freehold)",
      statusLabel: "Clear Title",
      border: "border-gray-200 dark:border-neutral-800 bg-white dark:bg-[#050505]"
    };
  };

  const currentTheme = getBadgeStyle();

  return (
    <section className={`rounded-none border p-4 transition-colors ${currentTheme.border}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2 border-b border-gray-200 dark:border-neutral-800 pb-3">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white">
              Encumbrance & Legal Status
            </span>
          </div>
          <p className="mt-0.5 text-[11px] text-gray-500 dark:text-neutral-400">
            Sub-Registrar Non-Encumbrance Search (Form 15)
          </p>
        </div>

        {/* Primary Status Badge */}
        <StatusPill status={currentTheme.text} size="sm" />
      </div>

      {/* Main Status Text */}
      <div className="mt-3 flex items-center justify-between border-b border-gray-200 dark:border-neutral-800 py-2.5">
        <span className="text-xs text-gray-500 dark:text-neutral-400">Tenure / Title Nature</span>
        <span className="text-xs font-bold text-gray-900 dark:text-white">{status}</span>
      </div>

      {/* Bank Mortgage Section */}
      <div className="border-b border-gray-200 dark:border-neutral-800 py-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 dark:text-neutral-400">Institutional Lien / Mortgage</span>
          <StatusPill status={isMortgaged ? "Active Lien" : "No Lien"} size="sm" />
        </div>

        {isMortgaged ? (
          <div className="mt-2 rounded-none bg-gray-50 dark:bg-[#111] p-2.5 text-xs border border-gray-200 dark:border-neutral-800 space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-neutral-400">Financier:</span>
              <span className="font-bold text-gray-900 dark:text-white">{mortgageDetails.bankName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-neutral-400">Loan Reference:</span>
              <span className="font-mono text-[11px] font-bold text-black dark:text-white">
                {mortgageDetails.loanId}
              </span>
            </div>
            {mortgageDetails.sanctionedAmount && (
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-neutral-400">Lien Amount:</span>
                <span className="font-mono font-bold text-amber-700 dark:text-amber-400">
                  {mortgageDetails.sanctionedAmount}
                </span>
              </div>
            )}
          </div>
        ) : (
          mortgageDetails.bankName && mortgageDetails.bankName !== "None" && (
            <p className="mt-1 text-[11px] text-gray-500 dark:text-neutral-400 italic">
              {mortgageDetails.bankName}
            </p>
          )
        )}
      </div>

      {/* Legal Disputes / Litigation Section */}
      <div className="border-b border-gray-200 dark:border-neutral-800 py-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 dark:text-neutral-400">Judicial / Dispute Status</span>
          <StatusPill status={hasDispute ? "Litigation Pending" : "Dispute Free"} size="sm" />
        </div>

        {hasDispute ? (
          <div className="mt-2 rounded-none bg-red-500/10 p-2.5 text-xs border border-red-500/30 space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-neutral-400">Suit Type:</span>
              <span className="font-bold text-red-700 dark:text-red-400">{legalDispute.status}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-neutral-400">Court Case:</span>
              <span className="font-mono text-[11px] font-bold text-gray-900 dark:text-white">
                {legalDispute.courtCaseId}
              </span>
            </div>
            {legalDispute.remarks && (
              <p className="mt-1 text-[11px] text-red-600 dark:text-red-400 leading-tight">
                ⚠️ {legalDispute.remarks}
              </p>
            )}
          </div>
        ) : (
          <p className="mt-1 text-[11px] text-gray-500 dark:text-neutral-400">
            {legalDispute.remarks || "No pending civil or revenue court stays."}
          </p>
        )}
      </div>

      {/* Non-Encumbrance Certificate (NEC) Verification */}
      <div className="pt-2.5">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-500 dark:text-neutral-400">Digital Certificate</span>
            <p className="font-mono text-xs font-bold text-gray-900 dark:text-white">
              {certificate.necNumber || "NEC-VERIFIED"}
            </p>
          </div>
          <span className="border border-gray-300 dark:border-neutral-800 bg-gray-100 dark:bg-[#111] px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-gray-700 dark:text-neutral-300 rounded-none">
            {certificate.validity || "30-Year Clear"}
          </span>
        </div>
      </div>
    </section>
  );
}

export default EncumbranceCard;
