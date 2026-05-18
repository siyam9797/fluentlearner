/**
 * CertificateVerify — FluentLearner Certificate Verification Page
 * 
 * Features:
 * - Search by Certificate ID to verify authenticity
 * - Beautiful certificate preview with FluentLearner branding
 * - Demo certificates for client approval
 * - Printable certificate design
 * - QR code concept for future verification
 */
import { useState, useRef } from "react";
import { Link } from "wouter";
import SEOHead from "@/components/SEOHead";
import { Search, Shield, CheckCircle, XCircle, Award, Calendar, BookOpen, ArrowLeft, Printer, Download, Star } from "lucide-react";
import { CONTACT, BRAND } from "@/lib/siteConstants";

// ============================================
// DEMO CERTIFICATE DATA
// ============================================
interface CertificateData {
  id: string;
  studentName: string;
  studentNameBn: string;
  courseName: string;
  courseNameBn: string;
  completionDate: string;
  bandScore: string;
  duration: string;
  mentorName: string;
  modules: string[];
  grade: string;
  issueDate: string;
  serialNo: string;
}

const demoCertificates: CertificateData[] = [
  {
    id: "FL-2026-0001",
    studentName: "Dr. Milon Chowdhury",
    studentNameBn: "ড. মিলন চৌধুরী",
    courseName: "IELTS VIP Course (1-to-1)",
    courseNameBn: "আইইএলটিএস ভিআইপি কোর্স",
    completionDate: "January 15, 2026",
    bandScore: "8.0",
    duration: "1 Month (Plan A)",
    mentorName: BRAND.FOUNDER,
    modules: ["Listening: 8.5", "Reading: 8.0", "Writing: 7.0", "Speaking: 7.5"],
    grade: "Distinction",
    issueDate: "January 20, 2026",
    serialNo: "FL/VIP/2026/001",
  },
  {
    id: "FL-2026-0002",
    studentName: "Dr. Afroza",
    studentNameBn: "ড. আফরোজা",
    courseName: "IELTS VIP Course (1-to-1)",
    courseNameBn: "আইইএলটিএস ভিআইপি কোর্স",
    completionDate: "January 22, 2026",
    bandScore: "7.5",
    duration: "2 Months (Plan B)",
    mentorName: BRAND.FOUNDER,
    modules: ["Listening: 9.0", "Reading: 8.0", "Writing: 7.0", "Speaking: 6.0"],
    grade: "Distinction",
    issueDate: "January 28, 2026",
    serialNo: "FL/VIP/2026/002",
  },
  {
    id: "FL-2026-0003",
    studentName: "Sajal Chaklader",
    studentNameBn: "সজল চাকলাদার",
    courseName: "IELTS VIP Course (1-to-1)",
    courseNameBn: "আইইএলটিএস ভিআইপি কোর্স",
    completionDate: "February 1, 2026",
    bandScore: "8.0",
    duration: "1 Month (Plan A)",
    mentorName: BRAND.FOUNDER,
    modules: ["Listening: 8.5", "Reading: 8.0", "Writing: 7.0", "Speaking: 7.5"],
    grade: "Distinction",
    issueDate: "February 5, 2026",
    serialNo: "FL/VIP/2026/003",
  },
  {
    id: "FL-2026-0004",
    studentName: "Nusrat Kabir",
    studentNameBn: "নুসরাত কবীর",
    courseName: "IELTS VIP Course (1-to-1)",
    courseNameBn: "আইইএলটিএস ভিআইপি কোর্স",
    completionDate: "January 28, 2026",
    bandScore: "7.0+",
    duration: "2 Months (Plan B)",
    mentorName: BRAND.FOUNDER,
    modules: ["Listening: 7.5", "Reading: 7.0", "Writing: 6.5", "Speaking: 7.0"],
    grade: "Merit",
    issueDate: "February 3, 2026",
    serialNo: "FL/VIP/2026/004",
  },
  {
    id: "FL-2026-0005",
    studentName: "Ataur Rahman",
    studentNameBn: "আতাউর রহমান",
    courseName: "Basic Grammar & Spoken English",
    courseNameBn: "বেসিক গ্রামার ও স্পোকেন ইংলিশ",
    completionDate: "January 10, 2026",
    bandScore: "N/A",
    duration: "2 Months",
    mentorName: BRAND.FOUNDER,
    modules: ["Grammar Fundamentals", "Vocabulary Building", "Daily Conversation", "Pronunciation"],
    grade: "Pass with Merit",
    issueDate: "January 15, 2026",
    serialNo: "FL/GS/2026/001",
  },
];

// ============================================
// CERTIFICATE CARD COMPONENT
// ============================================
function CertificatePreview({ cert, printRef }: { cert: CertificateData; printRef: React.RefObject<HTMLDivElement | null> }) {
  return (
    <div ref={printRef} className="bg-white">
      {/* Certificate Frame */}
      <div className="relative border-[3px] border-brand-red/20 p-1">
        <div className="border-[1px] border-brand-red/10 p-6 sm:p-8 lg:p-10">
          {/* Decorative Corner Elements */}
          <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-brand-red/40" />
          <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-brand-red/40" />
          <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-brand-red/40" />
          <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-brand-red/40" />

          {/* Header */}
          <div className="text-center mb-6">
            {/* Logo Area */}
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="w-12 h-12 bg-brand-red rounded-lg flex items-center justify-center">
                <span className="text-white font-display text-lg font-extrabold">FL</span>
              </div>
              <div className="text-left">
                <h1 className="font-display text-xl font-extrabold text-brand-dark tracking-tight">
                  FluentLearner
                </h1>
                <p className="text-brand-charcoal/50 font-body text-[10px] uppercase tracking-[0.2em]">
                  IELTS & Spoken English Academy
                </p>
              </div>
            </div>

            {/* Decorative Line */}
            <div className="flex items-center justify-center gap-3 my-4">
              <div className="h-px bg-brand-red/20 flex-1 max-w-24" />
              <Award className="w-5 h-5 text-brand-red" />
              <div className="h-px bg-brand-red/20 flex-1 max-w-24" />
            </div>

            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-brand-red uppercase tracking-[0.15em]">
              Certificate
            </h2>
            <p className="font-body text-brand-charcoal/50 text-sm mt-1 uppercase tracking-[0.1em]">
              of Completion
            </p>
          </div>

          {/* Body */}
          <div className="text-center mb-6">
            <p className="font-body text-brand-charcoal/60 text-sm mb-2">
              This is to certify that
            </p>
            <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-brand-dark mb-1">
              {cert.studentName}
            </h3>
            <p className="font-body text-brand-charcoal/40 text-sm mb-4">
              ({cert.studentNameBn})
            </p>
            <p className="font-body text-brand-charcoal/60 text-sm leading-relaxed max-w-lg mx-auto">
              has successfully completed the{" "}
              <span className="font-bold text-brand-dark">{cert.courseName}</span>{" "}
              program at FluentLearner Academy, demonstrating proficiency and dedication
              throughout the course duration of{" "}
              <span className="font-bold text-brand-dark">{cert.duration}</span>.
            </p>
          </div>

          {/* Score / Modules Section */}
          <div className="bg-brand-cream/50 rounded-lg p-4 sm:p-5 mb-6 border border-brand-red/5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              {cert.modules.map((mod, i) => {
                const parts = mod.split(": ");
                return (
                  <div key={i} className="bg-white rounded-lg p-3 border border-gray-100">
                    <p className="font-body text-brand-charcoal/40 text-[10px] uppercase tracking-wider mb-1">
                      {parts[0]}
                    </p>
                    <p className="font-display text-lg font-extrabold text-brand-red">
                      {parts[1] || parts[0]}
                    </p>
                  </div>
                );
              })}
            </div>
            {cert.bandScore !== "N/A" && (
              <div className="text-center mt-4 pt-3 border-t border-gray-100">
                <p className="font-body text-brand-charcoal/40 text-xs uppercase tracking-wider mb-1">
                  Overall IELTS Band Score
                </p>
                <p className="font-display text-4xl font-extrabold text-brand-red">
                  {cert.bandScore}
                </p>
              </div>
            )}
            <div className="text-center mt-3">
              <span className={`inline-block px-4 py-1.5 rounded-full text-xs font-body font-bold uppercase tracking-wider ${
                cert.grade === "Distinction" 
                  ? "bg-yellow-50 text-yellow-700 border border-yellow-200" 
                  : "bg-green-50 text-green-700 border border-green-200"
              }`}>
                {cert.grade === "Distinction" ? "⭐ " : "✅ "}{cert.grade}
              </span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
            <div className="text-center">
              <p className="font-body text-brand-charcoal/40 text-xs uppercase tracking-wider mb-1">
                Completion Date
              </p>
              <p className="font-display font-bold text-brand-dark">{cert.completionDate}</p>
            </div>
            <div className="text-center">
              <p className="font-body text-brand-charcoal/40 text-xs uppercase tracking-wider mb-1">
                Certificate ID
              </p>
              <p className="font-display font-bold text-brand-red">{cert.id}</p>
            </div>
          </div>

          {/* Signature Area */}
          <div className="flex items-end justify-between pt-4 border-t border-gray-100">
            <div className="text-center flex-1">
              <div className="w-32 mx-auto mb-2">
                <div className="border-b-2 border-brand-dark/30 pb-1">
                  <p className="font-display text-sm font-bold text-brand-dark italic">
                    {cert.mentorName}
                  </p>
                </div>
              </div>
              <p className="font-body text-brand-charcoal/40 text-[10px] uppercase tracking-wider">
                Founder & Lead Mentor
              </p>
            </div>
            <div className="text-center px-6">
              {/* Seal */}
              <div className="w-16 h-16 rounded-full border-2 border-brand-red/30 flex items-center justify-center bg-brand-red/5">
                <div className="text-center">
                  <Award className="w-5 h-5 text-brand-red mx-auto" />
                  <p className="text-[6px] font-display font-bold text-brand-red uppercase mt-0.5">Verified</p>
                </div>
              </div>
            </div>
            <div className="text-center flex-1">
              <div className="w-32 mx-auto mb-2">
                <div className="border-b-2 border-brand-dark/30 pb-1">
                  <p className="font-body text-xs text-brand-charcoal/50">
                    {cert.issueDate}
                  </p>
                </div>
              </div>
              <p className="font-body text-brand-charcoal/40 text-[10px] uppercase tracking-wider">
                Date of Issue
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-6 pt-4 border-t border-gray-100">
            <p className="font-body text-brand-charcoal/30 text-[10px]">
              Serial No: {cert.serialNo} | This certificate can be verified at fluentlearner.com/verify
            </p>
            <p className="font-body text-brand-charcoal/20 text-[9px] mt-1">
              FluentLearner IELTS & Spoken English Academy — Chittagong, Bangladesh
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// VERIFIED STUDENTS LIST
// ============================================
function VerifiedStudentsList() {
  return (
    <div className="mt-16">
      <div className="text-center mb-8">
        <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-brand-dark">
          যাচাইকৃত <span className="text-brand-red">শিক্ষার্থী</span> তালিকা
        </h2>
        <p className="font-body text-brand-charcoal/50 text-sm mt-2">
          আমাদের সকল সার্টিফিকেটধারী শিক্ষার্থীর তালিকা
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-brand-red text-white">
              <th className="px-4 py-3 text-left font-display text-sm font-bold">সার্টিফিকেট আইডি</th>
              <th className="px-4 py-3 text-left font-display text-sm font-bold">শিক্ষার্থীর নাম</th>
              <th className="px-4 py-3 text-left font-display text-sm font-bold hidden sm:table-cell">কোর্স</th>
              <th className="px-4 py-3 text-center font-display text-sm font-bold">স্কোর</th>
              <th className="px-4 py-3 text-center font-display text-sm font-bold hidden md:table-cell">গ্রেড</th>
              <th className="px-4 py-3 text-center font-display text-sm font-bold">স্ট্যাটাস</th>
            </tr>
          </thead>
          <tbody>
            {demoCertificates.map((cert, i) => (
              <tr 
                key={cert.id} 
                className={`border-b border-gray-100 hover:bg-brand-cream/30 transition-colors ${
                  i % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                }`}
              >
                <td className="px-4 py-3">
                  <span className="font-display text-sm font-bold text-brand-red">{cert.id}</span>
                </td>
                <td className="px-4 py-3">
                  <div>
                    <p className="font-display text-sm font-bold text-brand-dark">{cert.studentName}</p>
                    <p className="font-body text-xs text-brand-charcoal/40">{cert.studentNameBn}</p>
                  </div>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <p className="font-body text-sm text-brand-charcoal/60">{cert.courseNameBn}</p>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="font-display text-lg font-extrabold text-brand-red">{cert.bandScore}</span>
                </td>
                <td className="px-4 py-3 text-center hidden md:table-cell">
                  <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-body font-bold uppercase ${
                    cert.grade === "Distinction" 
                      ? "bg-yellow-50 text-yellow-700" 
                      : "bg-green-50 text-green-700"
                  }`}>
                    {cert.grade}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-[10px] font-body font-bold">
                    <CheckCircle className="w-3 h-3" />
                    Verified
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================
export default function CertificateVerify() {
  const [searchId, setSearchId] = useState("");
  const [searchResult, setSearchResult] = useState<CertificateData | null>(null);
  const [searched, setSearched] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const certRef = useRef<HTMLDivElement>(null);

  const handleSearch = () => {
    const trimmed = searchId.trim().toUpperCase();
    if (!trimmed) return;
    
    const found = demoCertificates.find(c => c.id === trimmed);
    setSearched(true);
    if (found) {
      setSearchResult(found);
      setNotFound(false);
    } else {
      setSearchResult(null);
      setNotFound(true);
    }
  };

  const handlePrint = () => {
    if (!certRef.current) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Certificate - ${searchResult?.studentName}</title>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800;900&family=Source+Sans+3:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Source Sans 3', sans-serif; padding: 20px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>${certRef.current.innerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  };

  return (
    <div className="min-h-screen bg-white">
      <SEOHead
        title="Certificate Verification - FluentLearner"
        description="Verify FluentLearner course completion certificates. Enter your certificate ID to check authenticity."
        path="/verify"
      />

      {/* Header */}
      <header className="bg-brand-red py-4">
        <div className="container flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center">
              <span className="text-brand-red font-display text-sm font-extrabold">FL</span>
            </div>
            <div>
              <h1 className="font-display text-base font-extrabold text-white tracking-tight">
                FluentLearner
              </h1>
              <p className="text-white/60 font-body text-[9px] uppercase tracking-[0.15em]">
                IELTS & Spoken English
              </p>
            </div>
          </Link>
          <Link href="/" className="flex items-center gap-1.5 text-white/70 hover:text-white transition-colors font-body text-sm">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">মূল পেজে ফিরুন</span>
          </Link>
        </div>
      </header>

      {/* Hero Search Section */}
      <section className="bg-gradient-to-b from-brand-red to-brand-red-dark py-12 sm:py-16">
        <div className="container text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="w-6 h-6 text-white/80" />
            <span className="text-white/60 font-body text-sm uppercase tracking-[0.15em]">
              Certificate Verification
            </span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-3">
            সার্টিফিকেট <span className="text-yellow-300">যাচাই</span> করুন
          </h1>
          <p className="font-body text-white/60 text-base max-w-lg mx-auto mb-8">
            আপনার সার্টিফিকেট আইডি লিখুন এবং FluentLearner কর্তৃক প্রদত্ত সার্টিফিকেটের সত্যতা যাচাই করুন।
          </p>

          {/* Search Box */}
          <div className="max-w-md mx-auto">
            <div className="flex bg-white rounded-xl overflow-hidden shadow-xl shadow-black/10">
              <input
                type="text"
                placeholder="সার্টিফিকেট আইডি (যেমন: FL-2026-0001)"
                value={searchId}
                onChange={(e) => {
                  setSearchId(e.target.value);
                  if (searched) { setSearched(false); setNotFound(false); setSearchResult(null); }
                }}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1 px-4 py-3.5 font-body text-sm text-brand-dark placeholder:text-brand-charcoal/30 focus:outline-none"
              />
              <button
                onClick={handleSearch}
                className="px-5 bg-brand-red hover:bg-brand-red-dark text-white transition-colors flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                <span className="font-display font-bold text-sm hidden sm:inline">যাচাই</span>
              </button>
            </div>

            {/* Quick Demo IDs */}
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <span className="text-white/40 font-body text-xs">ডেমো আইডি:</span>
              {["FL-2026-0001", "FL-2026-0002", "FL-2026-0003"].map(id => (
                <button
                  key={id}
                  onClick={() => { setSearchId(id); setSearched(false); setNotFound(false); setSearchResult(null); }}
                  className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white/70 rounded-full text-xs font-body transition-colors"
                >
                  {id}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="py-10 sm:py-14">
        <div className="container max-w-3xl">
          {/* Not Found State */}
          {searched && notFound && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="font-display text-xl font-bold text-brand-dark mb-2">
                সার্টিফিকেট পাওয়া যায়নি
              </h3>
              <p className="font-body text-brand-charcoal/50 text-sm max-w-sm mx-auto">
                "<span className="font-bold text-brand-dark">{searchId}</span>" আইডি দিয়ে কোনো সার্টিফিকেট পাওয়া যায়নি। 
                অনুগ্রহ করে আইডি সঠিকভাবে লিখুন অথবা আমাদের সাথে যোগাযোগ করুন।
              </p>
              <a
                href={`https://wa.me/${CONTACT.WHATSAPP_BUSINESS}?text=Assalamu%20Alaikum%2C%20I%20need%20help%20verifying%20my%20certificate`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-[#25D366] text-white rounded-lg font-body font-bold text-sm hover:bg-[#22c55e] transition-colors"
              >
                WhatsApp-এ যোগাযোগ করুন
              </a>
            </div>
          )}

          {/* Found State — Certificate Preview */}
          {searched && searchResult && (
            <div>
              {/* Verified Badge */}
              <div className="flex items-center justify-center gap-2 mb-6">
                <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-display font-bold text-green-700 text-sm">
                    সার্টিফিকেট যাচাইকৃত ✓
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-center gap-3 mb-6">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-4 py-2 bg-brand-red text-white rounded-lg font-body font-bold text-sm hover:bg-brand-red-dark transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  প্রিন্ট করুন
                </button>
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-4 py-2 border-2 border-gray-200 text-brand-charcoal/60 rounded-lg font-body font-bold text-sm hover:border-brand-red hover:text-brand-red transition-colors"
                >
                  <Download className="w-4 h-4" />
                  ডাউনলোড
                </button>
              </div>

              {/* Certificate */}
              <CertificatePreview cert={searchResult} printRef={certRef} />
            </div>
          )}

          {/* Default State — Instructions */}
          {!searched && (
            <div className="text-center py-8">
              <div className="grid sm:grid-cols-3 gap-6 max-w-2xl mx-auto">
                <div className="text-center">
                  <div className="w-12 h-12 bg-brand-red/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Search className="w-5 h-5 text-brand-red" />
                  </div>
                  <h4 className="font-display font-bold text-brand-dark text-sm mb-1">আইডি লিখুন</h4>
                  <p className="font-body text-brand-charcoal/40 text-xs">
                    সার্টিফিকেটে থাকা আইডি নম্বর উপরের বক্সে লিখুন
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-brand-red/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Shield className="w-5 h-5 text-brand-red" />
                  </div>
                  <h4 className="font-display font-bold text-brand-dark text-sm mb-1">যাচাই করুন</h4>
                  <p className="font-body text-brand-charcoal/40 text-xs">
                    আমাদের সিস্টেম তাৎক্ষণিকভাবে সার্টিফিকেটের সত্যতা যাচাই করবে
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-brand-red/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Award className="w-5 h-5 text-brand-red" />
                  </div>
                  <h4 className="font-display font-bold text-brand-dark text-sm mb-1">ফলাফল দেখুন</h4>
                  <p className="font-body text-brand-charcoal/40 text-xs">
                    সার্টিফিকেটের বিস্তারিত তথ্য ও প্রিন্ট করার সুবিধা পাবেন
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Verified Students Table */}
          <VerifiedStudentsList />
        </div>
      </section>

      {/* Trust Footer */}
      <section className="bg-brand-cream py-8 border-t border-gray-100">
        <div className="container text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Shield className="w-5 h-5 text-brand-red" />
            <span className="font-display font-bold text-brand-dark text-sm">
              FluentLearner Verified Certificates
            </span>
          </div>
          <p className="font-body text-brand-charcoal/40 text-xs max-w-md mx-auto mb-4">
            প্রতিটি সার্টিফিকেট FluentLearner কর্তৃক যাচাইকৃত এবং প্রমাণিত। 
            কোনো সমস্যা হলে আমাদের সাথে যোগাযোগ করুন।
          </p>
          <div className="flex items-center justify-center gap-4 text-brand-charcoal/30 font-body text-xs">
            <span>© {new Date().getFullYear()} FluentLearner</span>
            <span>•</span>
            <a href={`https://wa.me/${CONTACT.WHATSAPP_BUSINESS}`} target="_blank" rel="noopener noreferrer" className="hover:text-brand-red transition-colors">
              WhatsApp: {CONTACT.PHONE_SHORT}
            </a>
            <span>•</span>
            <Link href="/" className="hover:text-brand-red transition-colors">
              মূল পেজ
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
