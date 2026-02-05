import { Navbar } from "@/components/Navbar";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
        
        <div className="prose prose-invert max-w-none">
          <h1 className="text-3xl font-bold text-foreground mb-2">PRIVACY NOTICE</h1>
          <p className="text-muted-foreground mb-8">Last updated February 05, 2026</p>
          
          <p className="text-foreground/90 mb-6">
            This Privacy Notice for Remelic ("we," "us," or "our") describes how and why we might access, collect, store, use, and/or share ("process") your personal information when you use our services ("Services").
          </p>
          
          <p className="text-foreground/90 mb-4">When you:</p>
          <ul className="list-disc pl-6 mb-6 text-foreground/90">
            <li>Visit our website at <a href="https://remelic.com" className="text-primary hover:underline">https://remelic.com</a> or any website of ours that links to this Privacy Notice</li>
            <li>Engage with us in other related ways, including any marketing or events</li>
          </ul>
          
          <p className="text-foreground/90 mb-6">
            <strong>Questions or concerns?</strong> Reading this Privacy Notice will help you understand your privacy rights and choices. We are responsible for making decisions about how your personal information is processed. If you do not agree with our policies and practices, please do not use our Services. If you still have any questions or concerns, please contact us at <a href="mailto:henrikremelic@gmail.com" className="text-primary hover:underline">henrikremelic@gmail.com</a>.
          </p>

          <h2 className="text-2xl font-bold text-foreground mt-10 mb-4">SUMMARY OF KEY POINTS</h2>
          <p className="text-foreground/90 mb-4">
            This summary provides key points from our Privacy Notice, but you can find out more details about any of these topics by reading the full notice below.
          </p>
          
          <ul className="list-disc pl-6 mb-6 text-foreground/90 space-y-3">
            <li><strong>What personal information do we process?</strong> When you visit, use, or navigate our Services, we may process personal information depending on how you interact with us and the Services, the choices you make, and the products and features you use.</li>
            <li><strong>Do we process any sensitive personal information?</strong> We do not process sensitive personal information.</li>
            <li><strong>Do we collect any information from third parties?</strong> We do not collect any information from third parties.</li>
            <li><strong>How do we process your information?</strong> We process your information to provide, improve, and administer our Services, communicate with you, for security and fraud prevention, and to comply with law.</li>
            <li><strong>In what situations and with which parties do we share personal information?</strong> We may share information in specific situations and with specific third parties.</li>
            <li><strong>How do we keep your information safe?</strong> We have adequate organizational and technical processes and procedures in place to protect your personal information. However, no electronic transmission over the internet or information storage technology can be guaranteed to be 100% secure.</li>
            <li><strong>What are your rights?</strong> Depending on where you are located geographically, the applicable privacy law may mean you have certain rights regarding your personal information.</li>
            <li><strong>How do you exercise your rights?</strong> The easiest way to exercise your rights is by submitting a data subject access request, or by contacting us.</li>
          </ul>

          <h2 className="text-2xl font-bold text-foreground mt-10 mb-4">TABLE OF CONTENTS</h2>
          <ol className="list-decimal pl-6 mb-8 text-foreground/90 space-y-1">
            <li>WHAT INFORMATION DO WE COLLECT?</li>
            <li>HOW DO WE PROCESS YOUR INFORMATION?</li>
            <li>WHAT LEGAL BASES DO WE RELY ON TO PROCESS YOUR PERSONAL INFORMATION?</li>
            <li>WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?</li>
            <li>WHAT IS OUR STANCE ON THIRD-PARTY WEBSITES?</li>
            <li>DO WE USE COOKIES AND OTHER TRACKING TECHNOLOGIES?</li>
            <li>HOW LONG DO WE KEEP YOUR INFORMATION?</li>
            <li>HOW DO WE KEEP YOUR INFORMATION SAFE?</li>
            <li>WHAT ARE YOUR PRIVACY RIGHTS?</li>
            <li>CONTROLS FOR DO-NOT-TRACK FEATURES</li>
            <li>DO UNITED STATES RESIDENTS HAVE SPECIFIC PRIVACY RIGHTS?</li>
            <li>DO WE MAKE UPDATES TO THIS NOTICE?</li>
            <li>HOW CAN YOU CONTACT US ABOUT THIS NOTICE?</li>
            <li>HOW CAN YOU REVIEW, UPDATE, OR DELETE THE DATA WE COLLECT FROM YOU?</li>
          </ol>

          <h2 className="text-2xl font-bold text-foreground mt-10 mb-4" id="section1">1. WHAT INFORMATION DO WE COLLECT?</h2>
          <h3 className="text-xl font-semibold text-foreground mt-6 mb-3">Personal information you disclose to us</h3>
          <p className="text-foreground/90 mb-4">
            <strong>In Short:</strong> We collect personal information that you provide to us.
          </p>
          <p className="text-foreground/90 mb-4">
            We collect personal information that you voluntarily provide to us when you register on the Services, express an interest in obtaining information about us or our products and Services, when you participate in activities on the Services, or otherwise when you contact us.
          </p>
          <p className="text-foreground/90 mb-4">
            <strong>Information Provided by You.</strong> The personal information that we collect depends on the context of your interactions with us and the Services, the choices you make, and the products and features you use. The personal information we collect may include the following:
          </p>
          <ul className="list-disc pl-6 mb-4 text-foreground/90">
            <li>email addresses</li>
          </ul>
          <p className="text-foreground/90 mb-4">
            <strong>Sensitive Information.</strong> We do not process sensitive information.
          </p>
          <p className="text-foreground/90 mb-6">
            All personal information that you provide to us must be true, complete, and accurate, and you must notify us of any changes to such personal information.
          </p>

          <h2 className="text-2xl font-bold text-foreground mt-10 mb-4" id="section2">2. HOW DO WE PROCESS YOUR INFORMATION?</h2>
          <p className="text-foreground/90 mb-4">
            <strong>In Short:</strong> We process your information to provide, improve, and administer our Services, communicate with you, for security and fraud prevention, and to comply with law. We may also process your information for other purposes with your consent.
          </p>
          <p className="text-foreground/90 mb-4">
            We process your personal information for a variety of reasons, depending on how you interact with our Services, including:
          </p>
          <ul className="list-disc pl-6 mb-6 text-foreground/90 space-y-2">
            <li><strong>To facilitate account creation and authentication and otherwise manage user accounts.</strong> We may process your information so you can create and log in to your account, as well as keep your account in working order.</li>
            <li><strong>To enable user-to-user communications.</strong> We may process your information if you choose to use any of our offerings that allow for communication with another user.</li>
            <li><strong>To save or protect an individual's vital interest.</strong> We may process your information when necessary to save or protect an individual's vital interest, such as to prevent harm.</li>
          </ul>

          <h2 className="text-2xl font-bold text-foreground mt-10 mb-4" id="section3">3. WHAT LEGAL BASES DO WE RELY ON TO PROCESS YOUR INFORMATION?</h2>
          <p className="text-foreground/90 mb-4">
            <strong>In Short:</strong> We only process your personal information when we believe it is necessary and we have a valid legal reason (i.e. legal basis) to do so under applicable law, like with your consent, to comply with laws, to provide you with services to enter into or fulfill our contractual obligations, to protect your rights, or to fulfill our legitimate business interests.
          </p>
          <p className="text-foreground/90 mb-4">
            <strong>If you are located in the EU or UK, this section applies to you.</strong>
          </p>
          <p className="text-foreground/90 mb-4">
            The General Data Protection Regulation (GDPR) and UK GDPR require us to explain the valid legal bases we rely on in order to process your personal information. As such, we may rely on the following legal bases to process your personal information:
          </p>
          <ul className="list-disc pl-6 mb-4 text-foreground/90 space-y-2">
            <li><strong>Consent.</strong> We may process your information if you have given us permission (i.e. consent) to use your personal information for a specific purpose. You can withdraw your consent at any time.</li>
            <li><strong>Performance of a Contract.</strong> We may process your personal information when we believe it is necessary to fulfill our contractual obligations to you, including providing our Services or at your request prior to entering into a contract with you.</li>
            <li><strong>Legal Obligations.</strong> We may process your information where we believe it is necessary for compliance with our legal obligations, such as to cooperate with a law enforcement body or regulatory agency, exercise or defend our legal rights, or disclose your information as evidence in litigation in which we are involved.</li>
            <li><strong>Vital Interests.</strong> We may process your information where we believe it is necessary to protect your vital interests or the vital interests of a third party, such as situations involving potential threats to the safety of any person.</li>
          </ul>
          <p className="text-foreground/90 mb-4">
            <strong>If you are located in Canada, this section applies to you.</strong>
          </p>
          <p className="text-foreground/90 mb-4">
            We may process your information if you have given us specific permission (i.e. express consent) to use your personal information for a specific purpose, or in situations where your permission can be inferred (i.e. implied consent). You can withdraw your consent at any time.
          </p>
          <p className="text-foreground/90 mb-4">
            In some exceptional cases, we may be legally permitted under applicable law to process your information without your consent, including, for example:
          </p>
          <ul className="list-disc pl-6 mb-6 text-foreground/90 space-y-2">
            <li>If collection is clearly in the interests of an individual and consent cannot be obtained in a timely way</li>
            <li>For investigations and fraud detection and prevention</li>
            <li>For business transactions provided certain conditions are met</li>
            <li>If it is contained in a witness statement and the collection is necessary to assess, process, or settle an insurance claim</li>
            <li>For identifying injured, ill, or deceased persons and communicating with next of kin</li>
            <li>If we have reasonable grounds to believe an individual has been, is, or may be a victim of financial abuse</li>
            <li>If it is reasonable to expect collection and use with consent would compromise the availability or the accuracy of the information and the collection is reasonable for purposes related to investigating a breach of an agreement or a contravention of the laws of Canada or a province</li>
            <li>If disclosure is required to comply with a subpoena, warrant, court order, or rules of the court relating to the production of records</li>
            <li>If it was produced by an individual in the course of their employment, business, or profession and the collection is consistent with the purposes for which the information was produced</li>
            <li>If the collection is solely for journalistic, artistic, or literary purposes</li>
            <li>If the information is publicly available and is specified by the regulations</li>
          </ul>

          <h2 className="text-2xl font-bold text-foreground mt-10 mb-4" id="section4">4. WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?</h2>
          <p className="text-foreground/90 mb-4">
            <strong>In Short:</strong> We may share information in specific situations described in this section and/or with the following third parties.
          </p>
          <p className="text-foreground/90 mb-4">
            We may need to share your personal information in the following situations:
          </p>
          <ul className="list-disc pl-6 mb-6 text-foreground/90">
            <li><strong>Business Transfers.</strong> We may share or transfer your information in connection with, or during negotiations of, any merger, sale of company assets, financing, or acquisition of all or a portion of our business to another company.</li>
          </ul>

          <h2 className="text-2xl font-bold text-foreground mt-10 mb-4" id="section5">5. WHAT IS OUR STANCE ON THIRD-PARTY WEBSITES?</h2>
          <p className="text-foreground/90 mb-4">
            <strong>In Short:</strong> We are not responsible for the safety of any information that you share with third parties that we may link to or who advertise on our Services, but are not affiliated with, our Services.
          </p>
          <p className="text-foreground/90 mb-6">
            The Services may link to third-party websites, online services, or mobile applications and/or contain advertisements from third parties that are not affiliated with us and which may link to other websites, services, or applications. Accordingly, we do not make any guarantee regarding any such third parties, and we will not be liable for any loss or damage caused by the use of such third-party websites, services, or applications. The inclusion of a link towards a third-party website, service, or application does not imply an endorsement by us. We cannot guarantee the safety and privacy of data you provide to any third-party websites. Any data collected by third parties is not covered by this Privacy Notice. We are not responsible for the content or privacy and security practices and policies of any third parties, including other websites, services, or applications that may be linked to or from the Services. You should review the policies of such third parties and contact them directly to respond to your questions.
          </p>

          <h2 className="text-2xl font-bold text-foreground mt-10 mb-4" id="section6">6. DO WE USE COOKIES AND OTHER TRACKING TECHNOLOGIES?</h2>
          <p className="text-foreground/90 mb-4">
            <strong>In Short:</strong> We may use cookies and other tracking technologies to collect and store your information.
          </p>
          <p className="text-foreground/90 mb-4">
            We may use cookies and similar tracking technologies (like web beacons and pixels) to gather information when you interact with our Services. Some online tracking technologies help us maintain the security of our Services and your account, prevent crashes, fix bugs, save your preferences, and assist with basic site functions.
          </p>
          <p className="text-foreground/90 mb-4">
            We also permit third parties and service providers to use online tracking technologies on our Services for analytics and advertising, including to help manage and display advertisements, to tailor advertisements to your interests, or to send abandoned shopping cart reminders (depending on your communication preferences). The third parties and service providers use their technology to provide advertising about products and services tailored to your interests which may appear either on our Services or on other websites.
          </p>
          <p className="text-foreground/90 mb-6">
            Specific information about how we use such technologies and how you can refuse certain cookies is set out in our <Link to="/cookie-policy" className="text-primary hover:underline">Cookie Notice</Link>.
          </p>

          <h2 className="text-2xl font-bold text-foreground mt-10 mb-4" id="section7">7. HOW LONG DO WE KEEP YOUR INFORMATION?</h2>
          <p className="text-foreground/90 mb-4">
            <strong>In Short:</strong> We keep your information for as long as necessary to fulfill the purposes outlined in this Privacy Notice unless otherwise required by law.
          </p>
          <p className="text-foreground/90 mb-4">
            We will only keep your personal information for as long as it is necessary for the purposes set out in this Privacy Notice, unless a longer retention period is required or permitted by law (such as tax, accounting, or other legal requirements).
          </p>
          <p className="text-foreground/90 mb-6">
            When we have no ongoing legitimate business need to process your personal information, we will either delete or anonymize such information, or, if this is not possible (for example, because your personal information has been stored in backup archives), then we will securely store your personal information and isolate it from any further processing until deletion is possible.
          </p>

          <h2 className="text-2xl font-bold text-foreground mt-10 mb-4" id="section8">8. HOW DO WE KEEP YOUR INFORMATION SAFE?</h2>
          <p className="text-foreground/90 mb-4">
            <strong>In Short:</strong> We aim to protect your personal information through a system of organizational and technical security measures.
          </p>
          <p className="text-foreground/90 mb-6">
            We have implemented appropriate and reasonable technical and organizational security measures designed to protect the security of any personal information we process. However, despite our safeguards and efforts to secure your information, no electronic transmission over the Internet or information storage technology can be guaranteed to be 100% secure, so we cannot promise or guarantee that hackers, cybercriminals, or other unauthorized third parties will not be able to defeat our security and improperly collect, access, steal, or modify your information. Although we will do our best to protect your personal information, transmission of personal information to and from our Services is at your own risk. You should only access the Services within a secure environment.
          </p>

          <h2 className="text-2xl font-bold text-foreground mt-10 mb-4" id="section9">9. WHAT ARE YOUR PRIVACY RIGHTS?</h2>
          <p className="text-foreground/90 mb-4">
            <strong>In Short:</strong> Depending on your state of residence in the US or in some regions, such as the European Economic Area (EEA), United Kingdom (UK), Switzerland, and Canada, you have rights that allow you greater access to and control over your personal information.
          </p>
          <p className="text-foreground/90 mb-4">
            In some regions (like the EEA, UK, Switzerland, and Canada), you have certain rights under applicable data protection laws. These may include the right (i) to request access and obtain a copy of your personal information, (ii) to request rectification or erasure; (iii) to restrict the processing of your personal information; (iv) if applicable, to data portability; and (v) not to be subject to automated decision-making.
          </p>
          <p className="text-foreground/90 mb-4">
            If you are located in the EEA or UK and you believe we are unlawfully processing your personal information, you also have the right to complain to your Member State data protection authority or UK data protection authority.
          </p>
          <p className="text-foreground/90 mb-4">
            If you are located in Switzerland, you may contact the Federal Data Protection and Information Commissioner.
          </p>
          <p className="text-foreground/90 mb-4">
            <strong>Withdrawing your consent:</strong> If we are relying on your consent to process your personal information, you have the right to withdraw your consent at any time. You can withdraw your consent at any time by contacting us using the contact details provided in section 13 below.
          </p>
          <h3 className="text-xl font-semibold text-foreground mt-6 mb-3">Account Information</h3>
          <p className="text-foreground/90 mb-4">
            If you would at any time like to review or change the information in your account or terminate your account, you can:
          </p>
          <ul className="list-disc pl-6 mb-4 text-foreground/90">
            <li>Log in to your account settings and update your user account.</li>
          </ul>
          <p className="text-foreground/90 mb-4">
            Upon your request to terminate your account, we will deactivate or delete your account and information from our active databases.
          </p>
          <p className="text-foreground/90 mb-6">
            <strong>Cookies and similar technologies:</strong> Most Web browsers are set to accept cookies by default. If you prefer, you can usually choose to set your browser to remove cookies and to reject cookies. If you choose to remove cookies or reject cookies, this could affect certain features or services of our Services. You may also opt out of interest-based advertising by advertisers on our Services.
          </p>
          <p className="text-foreground/90 mb-6">
            If you have questions or comments about your privacy rights, you may email us at <a href="mailto:henrikremelic@gmail.com" className="text-primary hover:underline">henrikremelic@gmail.com</a>.
          </p>

          <h2 className="text-2xl font-bold text-foreground mt-10 mb-4" id="section10">10. CONTROLS FOR DO-NOT-TRACK FEATURES</h2>
          <p className="text-foreground/90 mb-4">
            Most web browsers and some mobile operating systems and mobile applications include a Do-Not-Track ("DNT") feature or setting you can activate to signal your privacy preference not to have data about your online browsing activities monitored and collected. At this stage, no uniform technology standard for recognizing and implementing DNT signals has been finalized. As such, we do not currently respond to DNT browser signals or any other mechanism that automatically communicates your choice not to be tracked online.
          </p>
          <p className="text-foreground/90 mb-6">
            California law requires us to let you know how we respond to web browser DNT signals. Because there currently is not an industry or legal standard for recognizing or honoring DNT signals, we do not respond to them at this time.
          </p>

          <h2 className="text-2xl font-bold text-foreground mt-10 mb-4" id="section11">11. DO UNITED STATES RESIDENTS HAVE SPECIFIC PRIVACY RIGHTS?</h2>
          <p className="text-foreground/90 mb-4">
            <strong>In Short:</strong> If you are a resident of certain US states, you may have additional rights regarding your personal information.
          </p>
          <p className="text-foreground/90 mb-4">
            You may have the right to request information about whether we have collected, used, or shared your personal data, correct inaccuracies, get a copy of, or delete your personal information. You may also have the right to withdraw your consent to our processing of your personal information.
          </p>
          <h3 className="text-xl font-semibold text-foreground mt-6 mb-3">Your Rights</h3>
          <p className="text-foreground/90 mb-4">
            You have rights under certain US state data protection laws. However, these rights are not absolute, and in certain cases, we may decline your request as permitted by law. These rights include:
          </p>
          <ul className="list-disc pl-6 mb-4 text-foreground/90 space-y-2">
            <li>Right to know whether or not we are processing your personal data</li>
            <li>Right to access your personal data</li>
            <li>Right to correct inaccuracies in your personal data</li>
            <li>Right to request the deletion of your personal data</li>
            <li>Right to obtain a copy of the personal data you previously shared with us</li>
            <li>Right to non-discrimination for exercising your rights</li>
            <li>Right to opt out of the processing of your personal data if it is used for targeted advertising, the sale of personal data, or profiling</li>
          </ul>
          <h3 className="text-xl font-semibold text-foreground mt-6 mb-3">How to Exercise Your Rights</h3>
          <p className="text-foreground/90 mb-4">
            To exercise these rights, you can contact us by submitting a data subject access request, by emailing us at <a href="mailto:henrikremelic@gmail.com" className="text-primary hover:underline">henrikremelic@gmail.com</a>, or by referring to the contact details at the bottom of this document.
          </p>
          <h3 className="text-xl font-semibold text-foreground mt-6 mb-3">Request Verification</h3>
          <p className="text-foreground/90 mb-6">
            Upon receiving your request, we will need to verify your identity to determine you are the same person about whom we have the information in our system. We will only use personal information provided in your request to verify your identity or authority to make the request.
          </p>

          <h2 className="text-2xl font-bold text-foreground mt-10 mb-4" id="section12">12. DO WE MAKE UPDATES TO THIS NOTICE?</h2>
          <p className="text-foreground/90 mb-4">
            <strong>In Short:</strong> Yes, we will update this notice as necessary to stay compliant with relevant laws.
          </p>
          <p className="text-foreground/90 mb-6">
            We may update this Privacy Notice from time to time. The updated version will be indicated by an updated "Revised" date at the top of this Privacy Notice. If we make material changes to this Privacy Notice, we may notify you either by prominently posting a notice of such changes or by directly sending you a notification. We encourage you to review this Privacy Notice frequently to be informed of how we are protecting your information.
          </p>

          <h2 className="text-2xl font-bold text-foreground mt-10 mb-4" id="section13">13. HOW CAN YOU CONTACT US ABOUT THIS NOTICE?</h2>
          <p className="text-foreground/90 mb-4">
            If you have questions or comments about this notice, you may email us at <a href="mailto:henrikremelic@gmail.com" className="text-primary hover:underline">henrikremelic@gmail.com</a> or contact us by post at:
          </p>
          <address className="text-foreground/90 mb-6 not-italic">
            Remelic<br />
            Oslo, 0373<br />
            Norway
          </address>

          <h2 className="text-2xl font-bold text-foreground mt-10 mb-4" id="section14">14. HOW CAN YOU REVIEW, UPDATE, OR DELETE THE DATA WE COLLECT FROM YOU?</h2>
          <p className="text-foreground/90 mb-6">
            Based on the applicable laws of your country or state of residence in the US, you may have the right to request access to the personal information we collect from you, details about how we have processed it, correct inaccuracies, or delete your personal information. You may also have the right to withdraw your consent to our processing of your personal information. These rights may be limited in some circumstances by applicable law. To request to review, update, or delete your personal information, please submit a data subject access request by contacting us using the details above.
          </p>

          <p className="text-muted-foreground text-sm mt-10">
            This Privacy Policy was created using Termly's Privacy Policy Generator.
          </p>
        </div>
      </main>
    </div>
  );
};

export default PrivacyPolicy;
