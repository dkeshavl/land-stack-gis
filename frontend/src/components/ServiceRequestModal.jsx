import { useState, useEffect } from "react";

/**
 * ServiceRequestModal Component for Land Stack GIS
 * Allows citizens to apply for Land Ownership Mutation / Title Transfer.
 *
 * Props:
 * - isOpen: boolean
 * - onClose: () => void
 * - initialUlpin: string | null
 * - onSuccess: (updatedParcelData: object, ulpin: string) => void
 */
function ServiceRequestModal({ isOpen, onClose, initialUlpin = "", onSuccess }) {
  const [ulpin, setUlpin] = useState("");
  const [currentOwner, setCurrentOwner] = useState("");
  const [newOwnerName, setNewOwnerName] = useState("");
  const [transferReason, setTransferReason] = useState("Sale Deed");
  const [applicantNotes, setApplicantNotes] = useState("");
  const [applicantPhone, setApplicantPhone] = useState("");
  const [mockFileName, setMockFileName] = useState("Registered_Sale_Deed_2026.pdf");
  const [declarationChecked, setDeclarationChecked] = useState(true);

  const [loading, setLoading] = useState(false);
  const [fetchingCurrent, setFetchingCurrent] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [submissionSuccess, setSubmissionSuccess] = useState(null);

  // Lookup current owner when ULPIN changes
  const lookupCurrentOwner = async (targetUlpin) => {
    if (!targetUlpin || targetUlpin.length < 5) {
      setCurrentOwner("");
      return;
    }
    setFetchingCurrent(true);
    try {
      const res = await fetch(`/api/parcel/${targetUlpin}`);
      if (res.ok) {
        const data = await res.json();
        setCurrentOwner(data.data?.ownership?.ownerName || "");
      } else {
        setCurrentOwner("");
      }
    } catch {
      setCurrentOwner("");
    } finally {
      setFetchingCurrent(false);
    }
  };

  // Sync initial ULPIN when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const targetUlpin = (initialUlpin || "").trim().toUpperCase();
    const timer = setTimeout(() => {
      setUlpin(targetUlpin);
      setNewOwnerName("");
      setApplicantNotes("");
      setErrorMessage("");
      setSubmissionSuccess(null);
      setMockFileName("Registered_Sale_Deed_2026.pdf");

      if (targetUlpin) {
        lookupCurrentOwner(targetUlpin);
      } else {
        setCurrentOwner("");
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [isOpen, initialUlpin]);

  const handleUlpinBlur = () => {
    lookupCurrentOwner(ulpin.trim().toUpperCase());
  };

  // Mock File Upload Handler
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setMockFileName(file.name);
    }
  };

  // Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanUlpin = ulpin.trim().toUpperCase();
    const cleanNewOwner = newOwnerName.trim();

    if (!cleanUlpin) {
      setErrorMessage("Please enter a valid 14-character ULPIN.");
      return;
    }

    if (!cleanNewOwner) {
      setErrorMessage("Please enter the legal name of the new owner.");
      return;
    }

    if (!declarationChecked) {
      setErrorMessage("Please confirm the legal declaration before submitting.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/mutation/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ulpin: cleanUlpin,
          newOwnerName: cleanNewOwner,
          transferReason,
          documentName: mockFileName,
          applicantNotes: applicantNotes.trim(),
          applicantPhone: applicantPhone.trim()
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSubmissionSuccess({
          applicationId: result.applicationId,
          ulpin: cleanUlpin,
          newOwnerName: cleanNewOwner,
          transferReason,
          message: result.message
        });

        if (onSuccess) {
          onSuccess(result.data, cleanUlpin);
        }
      } else {
        throw new Error(result.message || "Failed to submit mutation application");
      }
    } catch (err) {
      console.error("Mutation application error:", err);
      setErrorMessage(err.message || "Network error. Unable to reach server.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 sm:p-6">
      {/* Darkened Backdrop with blur */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog Card */}
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl transition">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 sm:text-lg">
                Application for Land Title Mutation
              </h3>
              <p className="text-xs text-slate-500">
                Form 12-A: Transfer of Ownership & RoR Registry Update
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-200/70 hover:text-slate-700"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {submissionSuccess ? (
            /* Success Confirmation Screen */
            <div className="flex flex-col items-center py-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl text-emerald-600 shadow-inner">
                ✓
              </div>

              <span className="mt-4 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-200">
                Application Queued for Review
              </span>

              <h4 className="mt-2 text-xl font-black text-slate-900">
                Application Submitted Successfully!
              </h4>

              <p className="mt-2 text-xs text-slate-500 sm:text-sm">
                Your request has been filed in the digital public cadastral registry.
              </p>

              {/* Application Details Summary */}
              <div className="mt-5 w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-left text-xs">
                <div className="flex justify-between border-b border-slate-200 pb-2.5">
                  <span className="text-slate-500">Application Number</span>
                  <span className="font-mono font-bold text-blue-700">{submissionSuccess.applicationId}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 py-2.5">
                  <span className="text-slate-500">Parcel ULPIN</span>
                  <span className="font-mono font-bold text-slate-800">{submissionSuccess.ulpin}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 py-2.5">
                  <span className="text-slate-500">New Transferee / Owner</span>
                  <span className="font-bold text-slate-800">{submissionSuccess.newOwnerName}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 py-2.5">
                  <span className="text-slate-500">Transfer Nature</span>
                  <span className="font-semibold text-slate-700">{submissionSuccess.transferReason}</span>
                </div>
                <div className="flex justify-between pt-2.5">
                  <span className="text-slate-500">Current Status</span>
                  <span className="inline-flex items-center gap-1 font-bold text-amber-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />
                    Pending Revenue Officer Approval
                  </span>
                </div>
              </div>

              <div className="mt-4 rounded-lg bg-blue-50 p-3 text-left text-[11px] text-blue-700">
                💡 <strong>Tip for Testing:</strong> Switch to the <strong>Admin Portal</strong> using the header toggle to view and approve this mutation application in real time!
              </div>

              <div className="mt-6 flex w-full justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-blue-700 sm:w-auto sm:px-6"
                >
                  Close & View Parcel
                </button>
              </div>
            </div>
          ) : (
            /* Mutation Application Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                  <svg className="h-4 w-4 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* ULPIN and Current Owner */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Parcel ULPIN <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={ulpin}
                    onChange={(e) => setUlpin(e.target.value.toUpperCase())}
                    onBlur={handleUlpinBlur}
                    placeholder="e.g. 1234567890ABCD"
                    required
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-xs font-semibold text-slate-800 uppercase shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                  <p className="mt-0.5 text-[10px] text-slate-400">14-digit Unique Land Parcel ID</p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Existing Owner
                  </label>
                  <div className="mt-1 flex h-[34px] items-center rounded-lg border border-slate-200 bg-slate-100 px-3 text-xs font-medium text-slate-700">
                    {fetchingCurrent ? (
                      <span className="text-slate-400 animate-pulse">Looking up RoR...</span>
                    ) : (
                      currentOwner || <span className="text-slate-400 italic">Not in cache / New Entry</span>
                    )}
                  </div>
                  <p className="mt-0.5 text-[10px] text-slate-400">Fetched from Land Revenue Database</p>
                </div>
              </div>

              {/* New Owner & Transfer Reason */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    New Transferee / Owner Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newOwnerName}
                    onChange={(e) => setNewOwnerName(e.target.value)}
                    placeholder="e.g. Sunita Rao"
                    required
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Nature of Transfer <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={transferReason}
                    onChange={(e) => setTransferReason(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="Sale Deed">Sale Deed (Sub-Registrar)</option>
                    <option value="Inheritance / Succession">Inheritance / Legal Heir Succession</option>
                    <option value="Gift Deed">Gift Deed / Settlement</option>
                    <option value="Family Partition">Family Partition / Division</option>
                    <option value="Court Decree">Court Decree / Legal Order</option>
                    <option value="Government Allotment">Government Allotment</option>
                  </select>
                </div>
              </div>

              {/* Applicant Phone / Remarks */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Applicant Mobile Number
                  </label>
                  <input
                    type="tel"
                    value={applicantPhone}
                    onChange={(e) => setApplicantPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Sub-Registrar Office / Deed No.
                  </label>
                  <input
                    type="text"
                    value={applicantNotes}
                    onChange={(e) => setApplicantNotes(e.target.value)}
                    placeholder="e.g. SRO-BLR-2026/459"
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              {/* Document Attachment Mock */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Supporting Document (Registered Deed / Encumbrance Certificate)
                </label>
                <div className="mt-1.5 flex items-center justify-between rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-100 text-red-600">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{mockFileName}</p>
                      <p className="text-[10px] text-slate-400">PDF • 2.4 MB • Certified Digital Copy</p>
                    </div>
                  </div>

                  <label className="cursor-pointer rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-blue-600 shadow-sm ring-1 ring-slate-200 transition hover:bg-blue-50">
                    <span>Replace File</span>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Legal Declaration */}
              <div className="flex items-start gap-2.5 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <input
                  type="checkbox"
                  id="mutation-declaration"
                  checked={declarationChecked}
                  onChange={(e) => setDeclarationChecked(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="mutation-declaration" className="text-[11px] leading-tight text-slate-600">
                  I hereby declare that the stamp duty and registration fees have been paid at the Sub-Registrar Office, and the particulars provided are authentic under the State Land Revenue Act.
                </label>
              </div>

              {/* Footer Actions */}
              <div className="mt-5 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-95 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={loading || !declarationChecked}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-md transition hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {loading ? (
                    <>
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Submitting Application...</span>
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Submit Mutation Request</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default ServiceRequestModal;
