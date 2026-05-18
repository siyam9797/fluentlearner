# Fluent Learner — করণীয় তালিকা

## Instruction Document Changes (March 3, 2026)

### 1. Course Details Page (NEW)
- [x] Add course details fields to database (fullDescription, curriculum, targetAudience, learningOutcomes, schedule, instructorInfo, courseFaq)
- [x] Create /courses/:slug detail page with full layout (description, curriculum accordion, features, instructor, FAQ, CTA)
- [x] Add "বিস্তারিত" button to course cards on homepage and /courses page
- [x] Admin: Rich text course details editor with curriculum, FAQ, instructor fields
- [x] Admin: Course preview functionality

### 2. Enrollment Flow Simplification
- [x] Pre-select course when user clicks "ভর্তি হন" from a specific course card (already works via courseId query param)
- [x] Show pre-filled and locked course selection when coming from specific course
- [x] Keep full flow with course selection for generic "Enroll Now" button

### 3. Hide Certificate Verify
- [x] Remove "Certificate Verify" link from footer
- [x] Comment out /certificate-verify route (don't delete code)
- [x] Remove any other references to certificate verification

### 4. Payment Instructions — Admin Editable
- [x] Payment settings already in database — verified and enhanced
- [x] Add QR code image upload support to payment settings
- [x] Display payment instructions on enrollment page (step 2)
- [x] Show default WhatsApp message if no payment configured

### 5. Fix Navigation Active State
- [x] Fix nav active state — uses exact path matching (already correct)
- [x] Only current page's nav link should be active
- [x] Anchor links (#about) should NOT appear active on different pages

### 6. Admin Content Editability Audit
- [x] Hero Section: Tagline, CTA text, statistics — admin-editable via Site Settings
- [x] About Section: Founder bio, description — admin-editable via Site Settings
- [ ] FAQ Section: Questions and answers — make admin-editable (future)
- [x] Contact Info: Phone, email, WhatsApp — admin-editable via Site Settings
- [x] Footer: All links and text — admin-editable via Site Settings

### 7. Testing
- [x] Test all pages end-to-end
- [x] Write vitest tests for new routes (getCourseBySlug tests added)
- [x] Verify mobile responsiveness
- [x] Save checkpoint (done - version 2f52e1a0)

## Fix Instructions v2 (March 3, 2026 — Second Round)

### কাজ ৪: Navigation Active State ফিক্স
- [x] Fix nav active state — use exact path matching (pathname === path), not includes()
- [x] About and Contact should NOT be active on homepage
- [x] Courses page should not show About as active

### কাজ ৩: Certificate Verify সম্পূর্ণ হাইড
- [x] Footer থেকে Certificate Verify লিংক সরাও (already done in v1)
- [x] Navigation/Header থেকেও সরাও (not present)
- [x] Route (/verify) commented out in App.tsx
- [x] Sitemap থেকেও বাদ দাও (no sitemap exists)

### কাজ ৫: Duplicate Data বাগ ফিক্স
- [x] ডাটাবেস চেক করো — payment_settings ও batches টেবিলে ডুপ্লিকেট ছিল (4x each)
- [x] ডুপ্লিকেট row মুছে দেওয়া হয়েছে (kept id=1 only)
- [x] Create mutation-এ disabled state যোগ করা হয়েছে (isSaving guard)
- [x] Frontend double-submit prevention added (isPending check)

### কাজ ১: কোর্স ডিটেলস পেজ উন্নত করো
- [x] videoUrl ফিল্ড যোগ করা হয়েছে schema-তে (YouTube embed)
- [x] Admin form-এ scrollable tabs with sections (মূল তথ্য, বিস্তারিত কন্টেন্ট, শিক্ষক তথ্য, FAQ)
- [x] Course detail page-এ video embed section যোগ করা হয়েছে
- [x] Course detail page-এ schedule ও maxStudents তথ্য দেখানো হচ্ছে (hero section-এ)

### কাজ ২: Enrollment Flow উন্নত করো
- [x] Course detail page থেকে "এখনই ভর্তি হন" ক্লিকে courseId pre-selected + auto-skip to Step 2
- [x] /courses পেজের "ভর্তি হন" বাটনেও একই আচরণ (pre-selected)

### কাজ ৭: পেমেন্ট ইনস্ট্রাকশন উন্নত করো
- [x] Step 2-এ প্রতিটি active পেমেন্ট পদ্ধতির বিস্তারিত দেখানো হচ্ছে (নাম, নম্বর, গ্রেডারের নাম, ধরন, নির্দেশনা, QR code)
- [x] নম্বরের পাশে "কপি করুন" বাটন যোগ করা হয়েছে
- [x] পেমেন্ট পদ্ধতি ডাটাবেস থেকে dynamic আসছে

### কাজ ৬: সাইট সেটিংস অ্যাডমিন মডিউল
- [x] site_settings টেবিল তৈরি করা হয়েছে (key-value pattern)
- [x] API: siteSettings.getAll (public) ও siteSettings.update (admin) তৈরি
- [x] অ্যাডমিন ড্যাশবোর্ডে "সাইট সেটিংস" মডিউল যোগ করা হয়েছে
- [x] Hero, About, TrustBar, Navbar, Footer, WhatsApp-এ dynamic data (useSiteSettings hook)

### কাজ ৮: কোর্স ডিটেলস পেজের SEO
- [x] React Helmet ইতোমধ্যে installed (react-helmet-async)
- [x] Title tag: {কোর্সের নাম} | FluentLearner
- [x] Meta description, Open Graph tags, Canonical URL, og:image যোগ করা হয়েছে

### New Admin User Addition
- [x] Add towhidulislam2.bd@gmail.com as admin with full dashboard access (promoted to admin role)

### URGENT: Database Cleanup Before Client Review
- [x] Delete ALL "Test IELTS Course" entries from courses table (7 deleted)
- [x] Remove duplicate bKash payment entries (4 duplicates deleted, accountHolder changed to MD Aditow Zahid)
- [x] Remove test enrollment records (1 fake enrollment deleted)
- [x] Verified: 6 legitimate courses remain (IELTS সম্পূর্ণ প্রস্তুতি কোর্স, Spoken English Mastery, IELTS VIP Batch, Basic Grammar & Foundation, IELTS Writing Masterclass, Study Abroad Guidance)
- [x] Verified: 1 bKash payment method, no duplicates
- [x] Save checkpoint with clean state (version: caad289f)

### Navigation Fix: About & Contact smooth-scroll
- [x] About nav link already /#about (smooth scroll handler in Navbar)
- [x] Contact nav link already /#contact (smooth scroll handler in Navbar)
- [x] About section has id="about" (AboutSection.tsx)
- [x] Contact/Footer has id="contact" (Footer.tsx)
- [x] Footer links updated with smooth scroll handler (handleLinkClick)
- [x] Smooth scroll works from any page (navigate to homepage + scroll after 300ms)
- [x] Save checkpoint and publish (version: f9438494)

### OAuth Login Fix & Security
- [x] Fix OAuth callback double-? bug (encode returnPath in state JSON, not redirectUri query param)
- [x] Update client/src/const.ts getLoginUrl() — state now contains JSON {redirectUri, returnPath}
- [x] Update server/_core/oauth.ts — decodes returnPath from state JSON, generic error messages
- [x] Verified: 3 admins only (rashik@jarifurrahim.one, jarifurrahim@gmail.com, towhidulislam2.bd@gmail.com)
- [x] Security headers added: X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, X-Powered-By removed
- [x] Test OAuth flow end-to-end (admin dashboard loads correctly on dev server)
- [x] Save checkpoint (version: ffd4f776)

### Unify Enrollment Flow (all paths → /enroll page)
- [x] Homepage "এখনই ভর্তি হন" button → navigate to /enroll instead of opening EnrollmentFunnel popup
- [x] Homepage course card "ভর্তি হন" buttons → navigate to /enroll?courseId=X instead of WhatsApp
- [x] Navbar "Enroll Now" button → navigate to /enroll
- [x] CTASection "এখনই ভর্তি হন" → navigate to /enroll
- [x] UrgencyBanner "এখনই ভর্তি হন" → navigate to /enroll
- [x] CoursesPage "ভর্তি হন" → fixed param from ?course= to ?courseId= for consistency
- [x] Ensure all enrollment paths show payment details + submit to admin dashboard (not WhatsApp)
- [x] EnrollmentProvider removed from App.tsx (no longer wrapping the app)
- [x] EnrollmentFunnel.tsx kept but no longer imported/used anywhere
- [x] Save checkpoint (version: 6359424f)

### Bug Fix: Payment Method Selection (March 5, 2026)
- [x] Fix: Selecting one payment method selects ALL methods simultaneously (changed from methodName to method.id comparison)
- [x] Clean up duplicate bKash entries in database (deleted id 90005, 120001 — kept id 1 only)
- [ ] Save checkpoint
