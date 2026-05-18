/**
 * EnrollPage — Multi-step enrollment form
 * 
 * Step 1: Course Selection + Course Details (who is this for, what you'll achieve)
 * Step 2: Payment Instructions (admin-configured payment methods, copy numbers)
 * Step 3: Student Info + Payment Verification (name, mobile, transaction ID)
 * Step 4: Success / Confirmation
 */
import { useState, useEffect, useMemo } from "react";
import { useLocation, useSearch, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { CONTACT, BRAND } from "@/lib/siteConstants";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  GraduationCap, ArrowRight, ArrowLeft, Check, Copy, CheckCircle2,
  BookOpen, Clock, Users, Star, Shield, Phone, Upload, Loader2,
  AlertCircle, ChevronDown, Sparkles, BadgeCheck, MessageCircle
} from "lucide-react";

// ============================================
// STEP INDICATOR
// ============================================
function StepIndicator({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  const steps = [
    { num: 1, label: "কোর্স নির্বাচন" },
    { num: 2, label: "পেমেন্ট পদ্ধতি" },
    { num: 3, label: "তথ্য জমা দিন" },
    { num: 4, label: "সম্পন্ন" },
  ];

  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2 mb-8">
      {steps.map((s, i) => (
        <div key={s.num} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                currentStep > s.num
                  ? "bg-green-500 text-white"
                  : currentStep === s.num
                  ? "bg-red-600 text-white ring-4 ring-red-100"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              {currentStep > s.num ? <Check className="w-4 h-4" /> : s.num}
            </div>
            <span className={`text-[10px] sm:text-xs mt-1 font-medium ${
              currentStep >= s.num ? "text-gray-800" : "text-gray-400"
            }`}>
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`w-8 sm:w-16 h-0.5 mx-1 sm:mx-2 mb-4 transition-all duration-300 ${
              currentStep > s.num ? "bg-green-500" : "bg-gray-200"
            }`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ============================================
// MAIN ENROLL PAGE
// ============================================
export default function EnrollPage() {
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const preSelectedCourseId = params.get("courseId");

  const hasPreSelected = !!preSelectedCourseId;
  const [step, setStep] = useState(hasPreSelected ? 2 : 1);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(
    preSelectedCourseId ? parseInt(preSelectedCourseId) : null
  );
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<number | null>(null);
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    studentName: "",
    studentMobile: "",
    studentEmail: "",
    paymentAccountNumber: "",
    transactionId: "",
    paymentAmount: "",
  });
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submittedId, setSubmittedId] = useState<number | null>(null);

  // Fetch data
  const { data: courses = [], isLoading: coursesLoading } = trpc.courses.list.useQuery();
  const { data: paymentMethods = [], isLoading: paymentsLoading } = trpc.paymentSettings.active.useQuery();
  const { data: activeBatches = [] } = trpc.batches.active.useQuery();

  const submitMutation = trpc.enrollments.submit.useMutation();
  const uploadMutation = trpc.upload.paymentScreenshot.useMutation();

  const selectedCourse = useMemo(
    () => courses.find(c => c.id === selectedCourseId),
    [courses, selectedCourseId]
  );

  const selectedPayment = useMemo(
    () => paymentMethods.find(p => p.id === selectedPaymentMethodId),
    [paymentMethods, selectedPaymentMethodId]
  );

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedNumber(text);
    setTimeout(() => setCopiedNumber(null), 2000);
  };

  // Handle screenshot
  const handleScreenshot = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, screenshot: "ফাইল সাইজ ২MB-এর বেশি হতে পারবে না" }));
      return;
    }
    setScreenshotFile(file);
    setScreenshotPreview(URL.createObjectURL(file));
    setErrors(prev => { const { screenshot, ...rest } = prev; return rest; });
  };

  // Validate step 3
  const validateStep3 = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.studentName.trim()) newErrors.studentName = "আপনার নাম লিখুন";
    if (!formData.studentMobile.trim()) {
      newErrors.studentMobile = "মোবাইল নম্বর দিন";
    } else if (!/^01[3-9]\d{8}$/.test(formData.studentMobile.replace(/[\s-]/g, ""))) {
      newErrors.studentMobile = "সঠিক ১১ সংখ্যার নম্বর দিন";
    }
    if (!formData.paymentAccountNumber.trim()) newErrors.paymentAccountNumber = "প্রেরকের নম্বর দিন";
    if (!formData.transactionId.trim()) newErrors.transactionId = "ট্রানজেকশন আইডি দিন";
    if (!formData.paymentAmount.trim()) newErrors.paymentAmount = "পেমেন্টের পরিমাণ দিন";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit enrollment
  const handleSubmit = async () => {
    if (!validateStep3() || !selectedCourseId) return;

    try {
      let screenshotUrl: string | undefined;

      // Upload screenshot if provided
      if (screenshotFile) {
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve) => {
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(",")[1]);
          };
          reader.readAsDataURL(screenshotFile);
        });

        const uploadResult = await uploadMutation.mutateAsync({
          base64,
          filename: screenshotFile.name,
          contentType: screenshotFile.type,
        });
        screenshotUrl = uploadResult.url;
      }

      const result = await submitMutation.mutateAsync({
        studentName: formData.studentName.trim(),
        studentMobile: formData.studentMobile.replace(/[\s-]/g, ""),
        studentEmail: formData.studentEmail.trim() || null,
        courseId: selectedCourseId,
        paymentMethod: selectedPayment?.methodName || "",
        paymentAccountNumber: formData.paymentAccountNumber.trim(),
        transactionId: formData.transactionId.trim(),
        paymentAmount: formData.paymentAmount.trim(),
        paymentScreenshotUrl: screenshotUrl || null,
      });

      setSubmittedId(result.id);
      setStep(4);
    } catch (error: any) {
      const msg = error?.message || "কিছু সমস্যা হয়েছে। আবার চেষ্টা করুন।";
      setErrors({ submit: msg });
    }
  };

  // Scroll to top on step change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1 pt-28 pb-16">
        <div className="max-w-3xl mx-auto px-4">
          <StepIndicator currentStep={step} totalSteps={4} />

          {/* ============================================ */}
          {/* STEP 1: Course Selection */}
          {/* ============================================ */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  আপনার কোর্স নির্বাচন করুন
                </h1>
                <p className="text-gray-600">
                  আপনার লক্ষ্য অনুযায়ী সবচেয়ে উপযুক্ত কোর্সটি বেছে নিন
                </p>
              </div>

              {coursesLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-red-600" />
                </div>
              ) : (
                <div className="grid gap-4">
                  {courses.map(course => (
                    <div
                      key={course.id}
                      onClick={() => setSelectedCourseId(course.id)}
                      className={`relative p-5 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                        selectedCourseId === course.id
                          ? "border-red-500 bg-red-50/50 shadow-lg shadow-red-100"
                          : "border-gray-200 bg-white hover:border-red-200 hover:shadow-md"
                      }`}
                    >
                      {/* Badge */}
                      {course.badge && (
                        <span className="absolute -top-2.5 right-4 bg-red-600 text-white text-xs font-bold px-3 py-0.5 rounded-full">
                          {course.badge}
                        </span>
                      )}

                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        {/* Course icon */}
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          selectedCourseId === course.id ? "bg-red-600" : "bg-gray-100"
                        }`}>
                          <GraduationCap className={`w-7 h-7 ${
                            selectedCourseId === course.id ? "text-white" : "text-gray-500"
                          }`} />
                        </div>

                        {/* Course info */}
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 text-lg">{course.name}</h3>
                          {course.shortDescription && (
                            <p className="text-gray-500 text-sm mt-0.5">{course.shortDescription}</p>
                          )}
                          <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-600">
                            {course.duration && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" /> {course.duration}
                              </span>
                            )}
                            {course.maxStudents && (
                              <span className="flex items-center gap-1">
                                <Users className="w-3.5 h-3.5" /> সর্বোচ্চ {course.maxStudents} জন
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Price */}
                        <div className="text-right flex-shrink-0">
                          {course.originalPrice && (
                            <span className="text-sm text-gray-400 line-through block">
                              {course.originalPrice}
                            </span>
                          )}
                          <span className="text-xl font-bold text-red-600">{course.price}</span>
                        </div>
                      </div>

                      {/* Expanded details when selected */}
                      {selectedCourseId === course.id && (
                        <div className="mt-4 pt-4 border-t border-red-200">
                          {/* Who is this for */}
                          <div className="mb-3">
                            <h4 className="font-semibold text-gray-800 text-sm mb-2 flex items-center gap-1.5">
                              <Users className="w-4 h-4 text-red-500" /> এই কোর্স যাদের জন্য
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {(course.features || []).slice(0, 4).map((f, i) => (
                                <span key={i} className="bg-white border border-red-100 text-gray-700 text-xs px-3 py-1 rounded-full">
                                  ✓ {f}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Learning outcomes */}
                          {course.learningOutcomes && course.learningOutcomes.length > 0 && (
                            <div>
                              <h4 className="font-semibold text-gray-800 text-sm mb-2 flex items-center gap-1.5">
                                <Star className="w-4 h-4 text-amber-500" /> কোর্স শেষে আপনি পাবেন
                              </h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                {course.learningOutcomes.map((o, i) => (
                                  <span key={i} className="flex items-start gap-1.5 text-sm text-gray-600">
                                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                    {o}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Selection indicator */}
                      {selectedCourseId === course.id && (
                        <div className="absolute top-4 left-4">
                          <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Next button */}
              <div className="flex justify-end pt-4">
                <button
                  onClick={() => selectedCourseId && setStep(2)}
                  disabled={!selectedCourseId}
                  className="flex items-center gap-2 bg-red-600 text-white px-8 py-3 rounded-xl font-bold text-lg hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  পরবর্তী ধাপ <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* ============================================ */}
          {/* STEP 2: Payment Instructions */}
          {/* ============================================ */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  পেমেন্ট করুন
                </h1>
                <p className="text-gray-600">
                  নিচের যেকোনো একটি পদ্ধতিতে পেমেন্ট করুন
                </p>
              </div>

              {/* Selected course summary */}
              {selectedCourse && (
                <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-gray-900">{selectedCourse.name}</p>
                    <p className="text-sm text-gray-500">{selectedCourse.duration}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-red-600">{selectedCourse.price}</p>
                    {selectedCourse.originalPrice && (
                      <p className="text-sm text-gray-400 line-through">{selectedCourse.originalPrice}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Payment amount info */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-amber-800 text-sm">পেমেন্টের নিয়ম</p>
                    <p className="text-amber-700 text-sm mt-1">
                      সম্পূর্ণ অথবা আংশিক পেমেন্ট করতে পারবেন। আংশিক পেমেন্টের ক্ষেত্রে ন্যূনতম ৫০% অগ্রিম প্রদান করুন।
                      বাকি টাকা কোর্স শুরুর আগে পরিশোধ করতে হবে।
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment methods */}
              {paymentsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-red-600" />
                </div>
              ) : paymentMethods.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                  <Phone className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 mb-2">পেমেন্ট পদ্ধতি এখনো সেটআপ হয়নি</p>
                  <p className="text-sm text-gray-400">
                    সরাসরি যোগাযোগ করুন: <a href={`tel:${CONTACT.PHONE_TEL}`} className="text-red-600 font-bold">{CONTACT.PHONE_SHORT}</a>
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {paymentMethods.map(method => (
                    <div
                      key={method.id}
                      onClick={() => setSelectedPaymentMethodId(method.id)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedPaymentMethodId === method.id
                          ? "border-red-500 bg-red-50/30"
                          : "border-gray-200 bg-white hover:border-red-200"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold ${
                            selectedPaymentMethodId === method.id
                              ? "bg-red-600 text-white"
                              : "bg-gray-100 text-gray-600"
                          }`}>
                            {method.methodName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{method.methodName}</p>
                            {method.accountType && (
                              <p className="text-xs text-gray-500">{method.accountType}</p>
                            )}
                          </div>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          selectedPaymentMethodId === method.id
                            ? "border-red-600 bg-red-600"
                            : "border-gray-300"
                        }`}>
                          {selectedPaymentMethodId === method.id && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                      </div>

                      {/* Expanded details */}
                      {selectedPaymentMethodId === method.id && (
                        <div className="mt-4 pt-3 border-t border-red-100 space-y-3">
                          {/* Account number with copy */}
                          <div className="bg-white rounded-lg border border-gray-200 p-3">
                            <p className="text-xs text-gray-500 mb-1">অ্যাকাউন্ট নম্বর</p>
                            <div className="flex items-center justify-between">
                              <span className="text-lg font-mono font-bold text-gray-900 tracking-wider">
                                {method.accountNumber}
                              </span>
                              <button
                                onClick={(e) => { e.stopPropagation(); copyToClipboard(method.accountNumber); }}
                                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                  copiedNumber === method.accountNumber
                                    ? "bg-green-100 text-green-700"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                }`}
                              >
                                {copiedNumber === method.accountNumber ? (
                                  <><CheckCircle2 className="w-4 h-4" /> কপি হয়েছে</>
                                ) : (
                                  <><Copy className="w-4 h-4" /> কপি করুন</>
                                )}
                              </button>
                            </div>
                            {method.accountHolder && (
                              <p className="text-xs text-gray-500 mt-1">
                                নাম: {method.accountHolder}
                              </p>
                            )}
                          </div>

                          {/* QR Code */}
                          {(method as any).qrCodeUrl && (
                            <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
                              <p className="text-xs text-gray-500 mb-2 font-medium">QR কোড স্ক্যান করে পেমেন্ট করুন</p>
                              <img
                                src={(method as any).qrCodeUrl}
                                alt={`${method.methodName} QR Code`}
                                className="w-40 h-40 mx-auto rounded-lg object-contain border"
                              />
                            </div>
                          )}

                          {/* Instructions */}
                          {method.instructions && (
                            <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                              <p className="text-xs font-bold text-blue-800 mb-1">নির্দেশনা:</p>
                              <p className="text-sm text-blue-700 whitespace-pre-line">{method.instructions}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between pt-4">
                <button
                  onClick={() => hasPreSelected ? window.history.back() : setStep(1)}
                  className="flex items-center gap-2 text-gray-600 px-6 py-3 rounded-xl font-medium hover:bg-gray-100 transition-all"
                >
                  <ArrowLeft className="w-5 h-5" /> {hasPreSelected ? "কোর্সে ফিরে যান" : "পূর্ববর্তী"}
                </button>
                <button
                  onClick={() => selectedPaymentMethodId && setStep(3)}
                  disabled={!selectedPaymentMethodId}
                  className="flex items-center gap-2 bg-red-600 text-white px-8 py-3 rounded-xl font-bold text-lg hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  পেমেন্ট করেছি <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* ============================================ */}
          {/* STEP 3: Student Info + Payment Verification */}
          {/* ============================================ */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  তথ্য জমা দিন
                </h1>
                <p className="text-gray-600">
                  আপনার তথ্য এবং পেমেন্টের বিবরণ দিন
                </p>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
                {/* Student Name */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">
                    আপনার পূর্ণ নাম <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.studentName}
                    onChange={e => setFormData(prev => ({ ...prev, studentName: e.target.value }))}
                    placeholder="যেমন: মোহাম্মদ আলী"
                    className={`w-full px-4 py-3 rounded-lg border ${errors.studentName ? "border-red-400 bg-red-50" : "border-gray-300"} focus:ring-2 focus:ring-red-200 focus:border-red-500 outline-none transition-all`}
                  />
                  {errors.studentName && <p className="text-red-500 text-xs mt-1">{errors.studentName}</p>}
                </div>

                {/* Student Mobile */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">
                    মোবাইল / হোয়াটসঅ্যাপ নম্বর <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.studentMobile}
                    onChange={e => setFormData(prev => ({ ...prev, studentMobile: e.target.value }))}
                    placeholder="01XXXXXXXXX"
                    className={`w-full px-4 py-3 rounded-lg border ${errors.studentMobile ? "border-red-400 bg-red-50" : "border-gray-300"} focus:ring-2 focus:ring-red-200 focus:border-red-500 outline-none transition-all`}
                  />
                  {errors.studentMobile && <p className="text-red-500 text-xs mt-1">{errors.studentMobile}</p>}
                </div>

                {/* Student Email (optional) */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">
                    ইমেইল <span className="text-gray-400 text-xs font-normal">(ঐচ্ছিক)</span>
                  </label>
                  <input
                    type="email"
                    value={formData.studentEmail}
                    onChange={e => setFormData(prev => ({ ...prev, studentEmail: e.target.value }))}
                    placeholder="example@gmail.com"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-200 focus:border-red-500 outline-none transition-all"
                  />
                </div>

                <hr className="border-gray-200" />

                {/* Payment details header */}
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">পেমেন্ট তথ্য</p>
                    <p className="text-xs text-gray-500">{selectedPayment?.methodName || ""} দিয়ে পেমেন্ট</p>
                  </div>
                </div>

                {/* Sender's number */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">
                    যে নম্বর থেকে পেমেন্ট করেছেন <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.paymentAccountNumber}
                    onChange={e => setFormData(prev => ({ ...prev, paymentAccountNumber: e.target.value }))}
                    placeholder="01XXXXXXXXX"
                    className={`w-full px-4 py-3 rounded-lg border ${errors.paymentAccountNumber ? "border-red-400 bg-red-50" : "border-gray-300"} focus:ring-2 focus:ring-red-200 focus:border-red-500 outline-none transition-all`}
                  />
                  {errors.paymentAccountNumber && <p className="text-red-500 text-xs mt-1">{errors.paymentAccountNumber}</p>}
                </div>

                {/* Transaction ID */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">
                    ট্রানজেকশন আইডি (TrxID) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.transactionId}
                    onChange={e => setFormData(prev => ({ ...prev, transactionId: e.target.value }))}
                    placeholder="যেমন: AK47HGFD8R"
                    className={`w-full px-4 py-3 rounded-lg border ${errors.transactionId ? "border-red-400 bg-red-50" : "border-gray-300"} focus:ring-2 focus:ring-red-200 focus:border-red-500 outline-none transition-all font-mono`}
                  />
                  {errors.transactionId && <p className="text-red-500 text-xs mt-1">{errors.transactionId}</p>}
                </div>

                {/* Payment Amount */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">
                    পেমেন্টের পরিমাণ (৳) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.paymentAmount}
                    onChange={e => setFormData(prev => ({ ...prev, paymentAmount: e.target.value }))}
                    placeholder="যেমন: 8500"
                    className={`w-full px-4 py-3 rounded-lg border ${errors.paymentAmount ? "border-red-400 bg-red-50" : "border-gray-300"} focus:ring-2 focus:ring-red-200 focus:border-red-500 outline-none transition-all`}
                  />
                  {errors.paymentAmount && <p className="text-red-500 text-xs mt-1">{errors.paymentAmount}</p>}
                </div>

                {/* Payment Screenshot (optional) */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">
                    পেমেন্ট স্ক্রিনশট <span className="text-gray-400 text-xs font-normal">(ঐচ্ছিক — দ্রুত ভেরিফিকেশনের জন্য)</span>
                  </label>
                  <div className="relative">
                    {screenshotPreview ? (
                      <div className="relative border border-gray-200 rounded-lg overflow-hidden">
                        <img src={screenshotPreview} alt="Screenshot" className="w-full max-h-48 object-contain bg-gray-50" />
                        <button
                          onClick={() => { setScreenshotFile(null); setScreenshotPreview(null); }}
                          className="absolute top-2 right-2 bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs hover:bg-red-700"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-red-300 hover:bg-red-50/30 transition-all">
                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-500">ক্লিক করে আপলোড করুন</span>
                        <span className="text-xs text-gray-400 mt-0.5">সর্বোচ্চ ২MB</span>
                        <input type="file" accept="image/*" onChange={handleScreenshot} className="hidden" />
                      </label>
                    )}
                  </div>
                  {errors.screenshot && <p className="text-red-500 text-xs mt-1">{errors.screenshot}</p>}
                </div>
              </div>

              {/* Submit error */}
              {errors.submit && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-red-700 text-sm">{errors.submit}</p>
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between pt-4">
                <button
                  onClick={() => setStep(2)}
                  className="flex items-center gap-2 text-gray-600 px-6 py-3 rounded-xl font-medium hover:bg-gray-100 transition-all"
                >
                  <ArrowLeft className="w-5 h-5" /> পূর্ববর্তী
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitMutation.isPending || uploadMutation.isPending}
                  className="flex items-center gap-2 bg-red-600 text-white px-8 py-3 rounded-xl font-bold text-lg hover:bg-red-700 disabled:opacity-60 transition-all"
                >
                  {(submitMutation.isPending || uploadMutation.isPending) ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> জমা হচ্ছে...</>
                  ) : (
                    <><BadgeCheck className="w-5 h-5" /> জমা দিন</>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ============================================ */}
          {/* STEP 4: Success Confirmation */}
          {/* ============================================ */}
          {step === 4 && (
            <div className="text-center space-y-6 py-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  আবেদন সফলভাবে জমা হয়েছে! 🎉
                </h1>
                <p className="text-gray-600 max-w-md mx-auto">
                  আপনার ভর্তি আবেদন সফলভাবে গ্রহণ করা হয়েছে। আমাদের টিম শীঘ্রই আপনার পেমেন্ট যাচাই করে নিশ্চিত করবে।
                </p>
              </div>

              {/* Status card */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-md mx-auto text-left space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">যাচাই প্রক্রিয়াধীন</p>
                    <p className="text-xs text-gray-500">সাধারণত ১-৩ ঘণ্টার মধ্যে</p>
                  </div>
                </div>

                {selectedCourse && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">কোর্স:</span>
                    <span className="font-medium text-gray-900">{selectedCourse.name}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">পেমেন্ট:</span>
                  <span className="font-medium text-gray-900">{selectedPayment?.methodName || ""} — ৳{formData.paymentAmount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">TrxID:</span>
                  <span className="font-mono font-medium text-gray-900">{formData.transactionId}</span>
                </div>
              </div>

              {/* Next steps */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 max-w-md mx-auto text-left">
                <h3 className="font-bold text-blue-800 text-sm mb-3">পরবর্তী ধাপ:</h3>
                <ol className="space-y-2 text-sm text-blue-700">
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center text-xs font-bold flex-shrink-0">১</span>
                    আমাদের টিম আপনার পেমেন্ট যাচাই করবে
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center text-xs font-bold flex-shrink-0">২</span>
                    আপনি WhatsApp-এ Student ID পাবেন
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center text-xs font-bold flex-shrink-0">৩</span>
                    ব্যাচ গ্রুপে যুক্ত করা হবে
                  </li>
                </ol>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                <a
                  href={`https://wa.me/${CONTACT.WHATSAPP_BUSINESS}?text=${encodeURIComponent("আমি ভর্তি আবেদন জমা দিয়েছি। অনুগ্রহ করে যাচাই করুন।")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-700 transition-all"
                >
                  <MessageCircle className="w-5 h-5" /> WhatsApp-এ যোগাযোগ
                </a>
                <Link href="/">
                  <span className="flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-medium hover:bg-gray-200 transition-all cursor-pointer">
                    হোম পেজে ফিরুন
                  </span>
                </Link>
              </div>

              {/* Trust badge */}
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500 pt-4">
                <Shield className="w-4 h-4 text-green-500" />
                ১০০% নিরাপদ — আপনার তথ্য সম্পূর্ণ গোপনীয়
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
