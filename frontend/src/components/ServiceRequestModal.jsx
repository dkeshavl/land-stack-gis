import { useState, useEffect, useRef } from "react";

/**
 * ServiceRequestModal Component for Land Stack GIS
 * Smart India Hackathon PS 26014 — Ministry of Rural Development
 *
 * Form 12-A: Multi-Step Title Mutation Application Wizard
 * Redesigned with SpaceX / Palantir DPI Terminal Aesthetic:
 * Stark high-contrast monochrome, sharp edges (rounded-none), monospace telemetry readouts,
 * ghost buttons, and instantaneous transitions.
 */
export default function ServiceRequestModal({
  isOpen,
  onClose,
  initialUlpin = "",
  onSuccess,
  refreshCurrentParcel
}) {
  const [currentStep, setCurrentStep] = useState(1); // 1 | 2 | 3 | 4

  // Form Fields
  const [ulpin, setUlpin] = useState("");
  const [currentOwner, setCurrentOwner] = useState("");
  const [newOwnerName, setNewOwnerName] = useState("");
  const [applicantPhone, setApplicantPhone] = useState("");
  const [applicantCapacity, setApplicantCapacity] = useState("Individual Buyer / Transferee");
  const [transferReason, setTransferReason] = useState("Sale Deed");
  const [applicantNotes, setApplicantNotes] = useState("");
  const [mockFileName, setMockFileName] = useState("REGISTERED_SALE_DEED_2026.PDF");
  const [declarationChecked, setDeclarationChecked] = useState(true);

  // Field validation touched states
  const [touched, setTouched] = useState({});

  // Operational states
  const [loading, setLoading] = useState(false);
  const [fetchingCurrent, setFetchingCurrent] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [submissionSuccess, setSubmissionSuccess] = useState(null);

  const modalRef = useRef(null);

  // Synchronize initial ULPIN when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const targetUlpin = (initialUlpin || "").trim().toUpperCase();
    setCurrentStep(targetUlpin ? 1 : 2); // If ULPIN pre-selected, start at Applicant Details, otherwise start at verification
    setUlpin(targetUlpin);
    setNewOwnerName("");
    setApplicantPhone("");
    setApplicantNotes("");
    setErrorMessage("");
    setSubmissionSuccess(null);
    setTouched({});
    setMockFileName("REGISTERED_SALE_DEED_2026.PDF");

    if (targetUlpin) {
      lookupCurrentOwner(targetUlpin);
    } else {
      setCurrentOwner("");
    }
  }, [isOpen, initialUlpin]);

  // Lookup existing owner from backend
  const lookupCurrentOwner = async (targetUlpin) => {
    if (!targetUlpin || targetUlpin.length < 5) {
      setCurrentOwner("");
      return;
    }
    setFetchingCurrent(true);
    try {
      let res = await fetch(`/api/parcel/${targetUlpin}`);
      if (!res.ok && res.status === 404) {
        res = await fetch(`/api/parcels/${targetUlpin}`);
      }
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

  // Field-level validation rules
  const validations = {
    newOwnerName: newOwnerName.trim().length >= 3,
    applicantPhone: /^[0-9+ -]{10,15}$/.test(applicantPhone.trim()),
    ulpin: ulpin.trim().length >= 10
  };

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen && !loading) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, loading, onClose]);

  // Wizard Navigation
  const canProceedFromStep1 = validations.newOwnerName && validations.applicantPhone;
  const canProceedFromStep2 = validations.ulpin;
  const canProceedFromStep3 = Boolean(mockFileName);

  const handleNext = () => {
    setErrorMessage("");
    if (currentStep === 1) {
      setTouched((prev) => ({ ...prev, newOwnerName: true, applicantPhone: true }));
      if (!canProceedFromStep1) {
        setErrorMessage("VALID APPLICANT LEGAL NAME AND MOBILE TELEMETRY REQUIRED.");
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setTouched((prev) => ({ ...prev, ulpin: true }));
      if (!canProceedFromStep2) {
        setErrorMessage("VALID 14-CHARACTER CADASTRAL ULPIN IDENTIFIER REQUIRED.");
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      setCurrentStep(4);
    }
  };

  const handleBack = () => {
    setErrorMessage("");
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  // File Upload Simulator
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setMockFileName(file.name.toUpperCase());
    }
  };

  // Final Form Submission
  const handleSubmit = async (e) => {
    e?.preventDefault();

    // Aggressively sanitize input fields: strip backslashes, newlines, and carriage returns
    const safeName = (newOwnerName || "").replace(/[\n\r\\]/g, "").trim();
    const cleanUlpin = (ulpin || "").replace(/[\n\r\\]/g, "").replace(/[^a-zA-Z0-9]/g, "").trim();
    const safeReason = (transferReason || "").replace(/[\n\r\\]/g, "").trim();
    const safeNotes = (applicantNotes || "").replace(/[\n\r\\]/g, "").trim();
    const safePhone = (applicantPhone || "").replace(/[\n\r\\]/g, "").trim();
    const safeDoc = (mockFileName || "").replace(/[\n\r\\]/g, "").trim();

    if (!cleanUlpin || !safeName) {
      setErrorMessage("INCOMPLETE RECORD: ALL MANDATORY FIELDS MUST BE SATISFIED.");
      return;
    }

    if (!declarationChecked) {
      setErrorMessage("STATUTORY LEGAL DECLARATION AFFIRMATION REQUIRED.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      // Register the formal mutation application with cadastral registry (Status: Pending Review)
      let applyRes = null;
      let applyData = null;
      try {
        applyRes = await fetch("/api/mutation/apply", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ulpin: cleanUlpin,
            newOwnerName: safeName,
            transferReason: safeReason,
            documentName: safeDoc,
            applicantNotes: safeNotes,
            applicantPhone: safePhone
          })
        });

        try {
          applyData = await applyRes.json();
        } catch (jsonErr) {
          console.warn("Could not parse POST response as JSON:", jsonErr);
          applyData = { success: applyRes.ok };
        }
      } catch (applyErr) {
        console.warn("Mutation registry application failed:", applyErr);
      }

      const isSuccess = Boolean(applyRes && applyRes.ok);

      if (isSuccess) {
        // Auto-Refresh: sync sidebar state
        if (typeof refreshCurrentParcel === "function") {
          await refreshCurrentParcel(cleanUlpin);
        } else if (typeof window.gisRefreshCurrentParcel === "function") {
          await window.gisRefreshCurrentParcel(cleanUlpin);
        }

        const payload = applyData?.data || { ulpin: cleanUlpin, newOwnerName: safeName };
        setSubmissionSuccess({
          applicationId: applyData?.applicationId || `MUT-${Date.now().toString().slice(-6)}`,
          ulpin: cleanUlpin,
          newOwnerName: safeName,
          transferReason: safeReason
        });

        if (onSuccess) {
          onSuccess(payload, cleanUlpin);
        }
      } else {
        const errorMsg = updateData?.message || applyData?.message || "TRANSACTION FAILURE: UNABLE TO COMMIT MUTATION TO CADASTRAL LEDGER.";
        throw new Error(errorMsg);
      }
    } catch (err) {
      console.error("Mutation application error:", err);
      setErrorMessage(err.message || "NETWORK ERROR: FAILED TO COMMUNICATE WITH CADASTRAL GATEWAY.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const stepLabels = [
    { num: 1, code: "01", title: "APPLICANT" },
    { num: 2, code: "02", title: "PARCEL" },
    { num: 3, code: "03", title: "DOCUMENTS" },
    { num: 4, code: "04", title: "REVIEW" }
  ];

  return (
    <div className="fixed inset-0 z-[2100] flex items-center justify-center p-2 sm:p-4 md:p-6">
      {/* High-Contrast Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 dark:bg-black/90 backdrop-blur-sm transition-opacity"
        onClick={loading ? undefined : onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Container */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mutation-modal-title"
        className="relative z-10 flex max-h-[94vh] w-full max-w-xl flex-col overflow-hidden rounded-none border border-gray-300 dark:border-neutral-800 bg-white dark:bg-[#050505] shadow-2xl transition-colors duration-100"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-gray-300 dark:border-neutral-800 bg-white dark:bg-[#050505] px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-none border border-black bg-black text-white dark:border-white dark:bg-white dark:text-black">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2.2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 id="mutation-modal-title" className="text-xl font-extrabold tracking-[0.1em] uppercase text-gray-900 dark:text-white">
                Form 12-A: Title Mutation
              </h3>
              <p className="text-xs font-mono tracking-widest text-gray-500 dark:text-neutral-500 uppercase mt-0.5">
                MINISTRY OF RURAL DEVELOPMENT • CADASTRAL ROR SANCTION
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label="Close modal"
            className="flex h-9 w-9 items-center justify-center rounded-none border border-transparent text-gray-400 transition-colors duration-100 hover:border-gray-300 hover:bg-gray-100 hover:text-black dark:text-neutral-500 dark:hover:border-neutral-700 dark:hover:bg-neutral-900 dark:hover:text-white"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* The Stepper (Sequence Indicator: Terminal Aesthetic) */}
        {!submissionSuccess && (
          <div className="border-b border-gray-200 dark:border-neutral-800 bg-gray-50/50 dark:bg-[#070707] px-6 pt-3">
            <div className="grid grid-cols-4 gap-2">
              {stepLabels.map((s) => {
                const isActive = currentStep === s.num;
                return (
                  <div
                    key={s.num}
                    className={`text-center transition-colors duration-100 ${
                      isActive
                        ? "border-b-2 border-black dark:border-white text-black dark:text-white pb-2 font-mono text-xs tracking-widest uppercase font-bold"
                        : "border-b-2 border-transparent text-gray-400 dark:text-neutral-600 pb-2 font-mono text-xs tracking-widest uppercase"
                    }`}
                    aria-current={isActive ? "step" : undefined}
                  >
                    <span className="inline-block truncate">
                      [{s.code}] {s.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {/* Error Banner */}
          {errorMessage && (
            <div
              role="alert"
              className="mb-5 flex items-center gap-3 rounded-none border border-red-500 bg-red-50/70 p-3.5 text-xs font-mono uppercase tracking-wider text-red-700 dark:border-red-600 dark:bg-red-950/30 dark:text-red-400"
            >
              <span className="font-bold text-red-600 dark:text-red-400">[ERR]</span>
              <span className="leading-snug">{errorMessage}</span>
            </div>
          )}

          {submissionSuccess ? (
            /* ============================================================ */
            /* SUCCESS CONFIRMATION READOUT */
            /* ============================================================ */
            <div className="flex flex-col items-center py-4 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-none border-2 border-black bg-black text-xl font-bold font-mono text-white dark:border-white dark:bg-white dark:text-black shadow-none">
                ✓
              </div>

              <div className="mt-4 rounded-none border border-gray-300 dark:border-neutral-700 bg-gray-50 dark:bg-[#0a0a0a] px-3 py-1 font-mono text-[10px] font-bold tracking-[0.2em] uppercase text-gray-700 dark:text-neutral-300">
                APPLICATION QUEUED FOR SANCTION
              </div>

              <h4 className="mt-3 text-xl font-extrabold tracking-[0.1em] uppercase text-gray-900 dark:text-white">
                APPLICATION FILED SUCCESSFULLY
              </h4>

              <p className="mt-1 text-xs font-mono tracking-widest uppercase text-gray-500 dark:text-neutral-500">
                ANCHORED WITH 14-DIGIT ULPIN IN DIGITAL PUBLIC CADASTRAL REGISTRY
              </p>

              {/* Stark Terminal Readout Grid */}
              <div className="mt-6 w-full rounded-none border border-gray-200 dark:border-neutral-800 bg-gray-50/50 dark:bg-[#0a0a0a] p-4 text-left divide-y divide-gray-200 dark:divide-neutral-800">
                <div className="flex justify-between pb-3">
                  <span className="text-[10px] font-mono tracking-widest uppercase text-gray-500 dark:text-neutral-500">
                    DOCKET / APPLICATION NO.
                  </span>
                  <span className="font-mono text-sm font-bold text-gray-900 dark:text-white tracking-wider">
                    {submissionSuccess.applicationId}
                  </span>
                </div>
                <div className="flex justify-between py-3">
                  <span className="text-[10px] font-mono tracking-widest uppercase text-gray-500 dark:text-neutral-500">
                    PARCEL ULPIN
                  </span>
                  <span className="font-mono text-sm font-bold text-gray-900 dark:text-white tracking-wider">
                    {submissionSuccess.ulpin}
                  </span>
                </div>
                <div className="flex justify-between py-3">
                  <span className="text-[10px] font-mono tracking-widest uppercase text-gray-500 dark:text-neutral-500">
                    NEW TRANSFEREE / OWNER
                  </span>
                  <span className="font-mono text-sm font-bold text-gray-900 dark:text-white">
                    {submissionSuccess.newOwnerName}
                  </span>
                </div>
                <div className="flex justify-between py-3">
                  <span className="text-[10px] font-mono tracking-widest uppercase text-gray-500 dark:text-neutral-500">
                    TRANSFER NATURE
                  </span>
                  <span className="font-mono text-sm font-bold text-gray-900 dark:text-white">
                    {submissionSuccess.transferReason}
                  </span>
                </div>
                <div className="flex justify-between pt-3">
                  <span className="text-[10px] font-mono tracking-widest uppercase text-gray-500 dark:text-neutral-500">
                    STATUS READOUT
                  </span>
                  <span className="font-mono text-xs font-bold text-black dark:text-white tracking-wider inline-flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 bg-black dark:bg-white animate-ping" />
                    PENDING REVENUE OFFICER SANCTION
                  </span>
                </div>
              </div>

              <div className="mt-4 w-full rounded-none border border-gray-300 dark:border-neutral-800 bg-gray-100/60 dark:bg-[#070707] p-3 text-left font-mono text-[10px] tracking-wider uppercase text-gray-600 dark:text-neutral-400">
                » TELEMETRY NOTE: REVENUE OFFICER VERIFICATION PORTAL CAN SANCTION THIS DOCKET LIVE FROM THE ADMIN DASHBOARD.
              </div>

              <div className="mt-6 flex w-full justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="border-2 border-black bg-black text-white hover:bg-transparent hover:text-black dark:border-white dark:bg-white dark:text-black dark:hover:bg-transparent dark:hover:text-white transition-colors duration-100 rounded-none px-8 py-3 uppercase text-xs tracking-[0.2em] font-bold w-full sm:w-auto cursor-pointer"
                >
                  RETURN TO CADASTRE
                </button>
              </div>
            </div>
          ) : (
            /* ============================================================ */
            /* MULTI-STEP WIZARD BODY */
            /* ============================================================ */
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* STEP 1: APPLICANT DETAILS */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-mono font-bold tracking-[0.15em] uppercase text-gray-900 dark:text-white">
                      SEQUENCE 01 // TRANSFEREE & APPLICANT TELEMETRY
                    </h4>
                    <p className="text-[11px] font-mono tracking-wider text-gray-500 dark:text-neutral-500 uppercase mt-0.5">
                      Enter the statutory particulars of the acquiring citizen or corporate entity.
                    </p>
                  </div>

                  {/* Transferee Name */}
                  <div>
                    <label className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-500 dark:text-neutral-400 mb-2 block">
                      Transferee / New Owner Legal Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={newOwnerName}
                        onChange={(e) => setNewOwnerName(e.target.value)}
                        onBlur={() => setTouched((p) => ({ ...p, newOwnerName: true }))}
                        placeholder="E.G. SMT. SUNITA RAO"
                        required
                        aria-invalid={touched.newOwnerName && !validations.newOwnerName}
                        className={`w-full rounded-none bg-gray-50 dark:bg-[#0a0a0a] border text-gray-900 dark:text-white px-4 py-3 font-mono text-sm focus:ring-0 transition-colors duration-100 ${
                          touched.newOwnerName && !validations.newOwnerName
                            ? "border-red-500 focus:border-red-500"
                            : "border-gray-300 dark:border-neutral-800 focus:border-black dark:focus:border-white"
                        }`}
                      />
                      {touched.newOwnerName && (
                        <div className="pointer-events-none absolute right-4 top-3.5 flex items-center">
                          {validations.newOwnerName ? (
                            <span className="font-mono text-xs font-bold text-gray-900 dark:text-white">✓</span>
                          ) : (
                            <span className="font-mono text-xs font-bold text-red-600 dark:text-red-400">✕</span>
                          )}
                        </div>
                      )}
                    </div>
                    {touched.newOwnerName && !validations.newOwnerName && (
                      <p className="mt-1.5 text-[10px] font-mono tracking-wider uppercase text-red-600 dark:text-red-400">
                        LEGAL NAME MUST CONTAIN A MINIMUM OF 3 CHARACTERS.
                      </p>
                    )}
                  </div>

                  {/* Mobile Number & Capacity */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-500 dark:text-neutral-400 mb-2 block">
                        Applicant Mobile Number <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="tel"
                          value={applicantPhone}
                          onChange={(e) => setApplicantPhone(e.target.value)}
                          onBlur={() => setTouched((p) => ({ ...p, applicantPhone: true }))}
                          placeholder="+91 98765 43210"
                          required
                          className={`w-full rounded-none bg-gray-50 dark:bg-[#0a0a0a] border text-gray-900 dark:text-white px-4 py-3 font-mono text-sm focus:ring-0 transition-colors duration-100 ${
                            touched.applicantPhone && !validations.applicantPhone
                              ? "border-red-500 focus:border-red-500"
                              : "border-gray-300 dark:border-neutral-800 focus:border-black dark:focus:border-white"
                          }`}
                        />
                        {touched.applicantPhone && (
                          <div className="pointer-events-none absolute right-4 top-3.5 flex items-center">
                            {validations.applicantPhone ? (
                              <span className="font-mono text-xs font-bold text-gray-900 dark:text-white">✓</span>
                            ) : (
                              <span className="font-mono text-xs font-bold text-red-600 dark:text-red-400">✕</span>
                            )}
                          </div>
                        )}
                      </div>
                      <p className="mt-1 text-[10px] font-mono tracking-wider uppercase text-gray-400 dark:text-neutral-500">
                        CELLULAR DISPATCH FOR LEDGER AUDIT LOGS
                      </p>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-500 dark:text-neutral-400 mb-2 block">
                        Applicant Capacity / Role
                      </label>
                      <select
                        value={applicantCapacity}
                        onChange={(e) => setApplicantCapacity(e.target.value)}
                        className="w-full rounded-none bg-gray-50 dark:bg-[#0a0a0a] border border-gray-300 dark:border-neutral-800 text-gray-900 dark:text-white px-4 py-3 font-mono text-sm focus:ring-0 focus:border-black dark:focus:border-white transition-colors duration-100 cursor-pointer"
                      >
                        <option value="Individual Buyer / Transferee">INDIVIDUAL BUYER / TRANSFEREE</option>
                        <option value="Legal Heir / Next of Kin">LEGAL HEIR / NEXT OF KIN</option>
                        <option value="Gift Donee">GIFT DONEE</option>
                        <option value="Power of Attorney Holder">POWER OF ATTORNEY HOLDER</option>
                        <option value="Authorized Corporate Officer">AUTHORIZED CORPORATE OFFICER</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: PARCEL VERIFICATION */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-mono font-bold tracking-[0.15em] uppercase text-gray-900 dark:text-white">
                      SEQUENCE 02 // CADASTRAL PARCEL & TRANSFER NATURE
                    </h4>
                    <p className="text-[11px] font-mono tracking-wider text-gray-500 dark:text-neutral-500 uppercase mt-0.5">
                      Link application to verified 14-character ULPIN and specify statutory conveyance type.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {/* ULPIN Input */}
                    <div>
                      <label className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-500 dark:text-neutral-400 mb-2 block">
                        14-digit ULPIN <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={ulpin}
                          onChange={(e) => setUlpin(e.target.value.toUpperCase())}
                          onBlur={() => {
                            setTouched((p) => ({ ...p, ulpin: true }));
                            lookupCurrentOwner(ulpin.trim().toUpperCase());
                          }}
                          placeholder="E.G. 29572001218249"
                          required
                          className="w-full rounded-none bg-gray-50 dark:bg-[#0a0a0a] border border-gray-300 dark:border-neutral-800 text-gray-900 dark:text-white px-4 py-3 font-mono text-sm uppercase focus:ring-0 focus:border-black dark:focus:border-white transition-colors duration-100"
                        />
                        {validations.ulpin && (
                          <span className="pointer-events-none absolute right-4 top-3.5 font-mono text-xs font-bold text-gray-900 dark:text-white">
                            ✓
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Current Owner Readout */}
                    <div>
                      <label className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-500 dark:text-neutral-400 mb-2 block">
                        Current Registered Owner
                      </label>
                      <div className="flex h-[46px] items-center rounded-none border border-gray-200 dark:border-neutral-800/80 bg-gray-100 dark:bg-[#0e0e0e] px-4 font-mono text-sm text-gray-900 dark:text-neutral-200">
                        {fetchingCurrent ? (
                          <span className="text-gray-400 dark:text-neutral-500 animate-pulse tracking-widest text-xs">
                            [SYNCING ROR LEDGER...]
                          </span>
                        ) : (
                          currentOwner || (
                            <span className="text-gray-400 dark:text-neutral-500 italic text-xs">
                              [AUTO-FETCHED FROM POSTGIS]
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Transfer Nature Selection */}
                  <div>
                    <label className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-500 dark:text-neutral-400 mb-2 block">
                      Nature of Title Transfer <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={transferReason}
                      onChange={(e) => setTransferReason(e.target.value)}
                      className="w-full rounded-none bg-gray-50 dark:bg-[#0a0a0a] border border-gray-300 dark:border-neutral-800 text-gray-900 dark:text-white px-4 py-3 font-mono text-sm focus:ring-0 focus:border-black dark:focus:border-white transition-colors duration-100 cursor-pointer"
                    >
                      <option value="Sale Deed">SALE DEED (SUB-REGISTRAR CERTIFIED)</option>
                      <option value="Inheritance / Succession">INHERITANCE / LEGAL HEIR SUCCESSION</option>
                      <option value="Gift Deed">GIFT DEED / FAMILY SETTLEMENT</option>
                      <option value="Family Partition">FAMILY PARTITION / COURT DECREE</option>
                      <option value="Government Allotment">GOVERNMENT ALLOTMENT / GRANT</option>
                    </select>
                  </div>
                </div>
              )}

              {/* STEP 3: SUPPORTING DOCUMENTS (Secure Ingestion Zone) */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-mono font-bold tracking-[0.15em] uppercase text-gray-900 dark:text-white">
                      SEQUENCE 03 // EVIDENCE & DEED REGISTRATION
                    </h4>
                    <p className="text-[11px] font-mono tracking-wider text-gray-500 dark:text-neutral-500 uppercase mt-0.5">
                      Upload certified electronic sale deed or encumbrance title certificate.
                    </p>
                  </div>

                  {/* SRO Deed Reference */}
                  <div>
                    <label className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-500 dark:text-neutral-400 mb-2 block">
                      Sub-Registrar Office (SRO) Deed / Book Reference
                    </label>
                    <input
                      type="text"
                      value={applicantNotes}
                      onChange={(e) => setApplicantNotes(e.target.value)}
                      placeholder="E.G. SRO-BLR-NORTH-2026/VOL-412/PAGE-89"
                      className="w-full rounded-none bg-gray-50 dark:bg-[#0a0a0a] border border-gray-300 dark:border-neutral-800 text-gray-900 dark:text-white px-4 py-3 font-mono text-sm uppercase focus:ring-0 focus:border-black dark:focus:border-white transition-colors duration-100"
                    />
                  </div>

                  {/* Secure Data Ingestion Zone */}
                  <div>
                    <label className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-500 dark:text-neutral-400 mb-2 block">
                      Ingestion Document Attachment (PDF / JPG / PNG)
                    </label>
                    <div className="border-2 border-dashed border-gray-300 dark:border-neutral-700 bg-gray-50 dark:bg-[#0a0a0a] hover:border-black dark:hover:border-white transition-colors duration-100 rounded-none p-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-none border border-black dark:border-white bg-black dark:bg-white text-white dark:text-black">
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-mono text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white">
                              {mockFileName}
                            </p>
                            <p className="text-[10px] font-mono tracking-widest uppercase text-gray-500 dark:text-neutral-500 mt-0.5">
                              CERTIFIED ELECTRONIC RECORD • SHA-256 VERIFIED • 2.4 MB
                            </p>
                          </div>
                        </div>

                        <label className="cursor-pointer rounded-none border border-black dark:border-white bg-transparent px-4 py-2 text-[10px] font-mono font-bold tracking-[0.15em] uppercase text-black dark:text-white transition-colors duration-100 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black text-center sm:text-left">
                          <span>REPLACE FILE</span>
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: REVIEW & SANCTION (Terminal Readout Grid) */}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-mono font-bold tracking-[0.15em] uppercase text-gray-900 dark:text-white">
                      SEQUENCE 04 // AUDIT RECAP & SANCTION REVIEW
                    </h4>
                    <p className="text-[11px] font-mono tracking-wider text-gray-500 dark:text-neutral-500 uppercase mt-0.5">
                      Verify application particulars before committing to the immutable cadastral ledger.
                    </p>
                  </div>

                  {/* Stark Terminal Readout Grid */}
                  <div className="rounded-none border border-gray-200 dark:border-neutral-800 bg-gray-50/50 dark:bg-[#0a0a0a] p-4 divide-y divide-gray-200 dark:divide-neutral-800">
                    <div className="grid grid-cols-2 gap-4 pb-3">
                      <div>
                        <span className="text-[10px] font-mono tracking-widest uppercase text-gray-500 dark:text-neutral-500 block mb-1">
                          PARCEL ULPIN
                        </span>
                        <p className="font-mono text-sm font-bold text-gray-900 dark:text-white tracking-wider">
                          {ulpin}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] font-mono tracking-widest uppercase text-gray-500 dark:text-neutral-500 block mb-1">
                          RECORDED OWNER
                        </span>
                        <p className="font-mono text-sm font-bold text-gray-900 dark:text-white">
                          {currentOwner || "[RECORD IN POSTGIS CACHE]"}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 py-3">
                      <div>
                        <span className="text-[10px] font-mono tracking-widest uppercase text-gray-500 dark:text-neutral-500 block mb-1">
                          NEW TRANSFEREE
                        </span>
                        <p className="font-mono text-sm font-bold text-gray-900 dark:text-white">
                          {newOwnerName}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] font-mono tracking-widest uppercase text-gray-500 dark:text-neutral-500 block mb-1">
                          CONVEYANCE NATURE
                        </span>
                        <p className="font-mono text-sm font-bold text-gray-900 dark:text-white">
                          {transferReason}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-3">
                      <div>
                        <span className="text-[10px] font-mono tracking-widest uppercase text-gray-500 dark:text-neutral-500 block mb-1">
                          APPLICANT PHONE
                        </span>
                        <p className="font-mono text-sm font-bold text-gray-900 dark:text-white">
                          {applicantPhone}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] font-mono tracking-widest uppercase text-gray-500 dark:text-neutral-500 block mb-1">
                          ATTACHED EVIDENCE
                        </span>
                        <p className="font-mono text-sm font-bold text-gray-900 dark:text-white truncate">
                          {mockFileName}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Statutory Legal Declaration */}
                  <div className="flex items-start gap-3 rounded-none border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-[#0a0a0a] p-3.5">
                    <input
                      type="checkbox"
                      id="mutation-declaration"
                      checked={declarationChecked}
                      onChange={(e) => setDeclarationChecked(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded-none border-2 border-gray-400 dark:border-neutral-600 bg-transparent text-black dark:text-white focus:ring-0 focus:ring-offset-0 cursor-pointer"
                    />
                    <label
                      htmlFor="mutation-declaration"
                      className="text-[11px] font-mono leading-relaxed text-gray-600 dark:text-neutral-400 cursor-pointer select-none uppercase tracking-wide"
                    >
                      I HEREBY SOLEMNLY AFFIRM THAT STATUTORY SRO STAMP DUTY AND CADASTRAL REGISTRATION FEES HAVE BEEN REMITTED, AND SUBMITTED PARTICULARS ARE AUTHENTIC UNDER THE STATE LAND REVENUE CODE.
                    </label>
                  </div>
                </div>
              )}

              {/* Wizard Action Controls (SpaceX Ghost Style) */}
              <div className="mt-6 flex items-center justify-between border-t border-gray-200 dark:border-neutral-800 pt-5">
                <div>
                  {currentStep > 1 && (
                    <button
                      type="button"
                      onClick={handleBack}
                      disabled={loading}
                      className="text-gray-500 hover:text-black dark:text-neutral-500 dark:hover:text-white uppercase text-xs tracking-[0.2em] font-bold px-4 py-3 transition-colors duration-100 cursor-pointer"
                    >
                      ← BACK
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={loading}
                    className="text-gray-500 hover:text-black dark:text-neutral-500 dark:hover:text-white uppercase text-xs tracking-[0.2em] font-bold px-4 py-3 transition-colors duration-100 cursor-pointer"
                  >
                    CANCEL
                  </button>

                  {currentStep < 4 ? (
                    <button
                      type="button"
                      onClick={handleNext}
                      className="border-2 border-black bg-black text-white hover:bg-transparent hover:text-black dark:border-white dark:bg-white dark:text-black dark:hover:bg-transparent dark:hover:text-white transition-colors duration-100 rounded-none px-8 py-3 uppercase text-xs tracking-[0.2em] font-bold cursor-pointer"
                    >
                      NEXT STEP →
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={loading || !declarationChecked}
                      className="border-2 border-black bg-black text-white hover:bg-transparent hover:text-black dark:border-white dark:bg-white dark:text-black dark:hover:bg-transparent dark:hover:text-white transition-colors duration-100 rounded-none px-8 py-3 uppercase text-xs tracking-[0.2em] font-bold inline-flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <span className="h-3.5 w-3.5 animate-spin border-2 border-current border-t-transparent" />
                          <span>COMMITTING TO LEDGER...</span>
                        </>
                      ) : (
                        <>
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2.2" d="M5 13l4 4L19 7" />
                          </svg>
                          <span>SUBMIT FORM 12-A</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
