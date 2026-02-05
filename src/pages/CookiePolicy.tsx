import { Navbar } from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";

const CookiePolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <Card className="max-w-4xl mx-auto">
          <CardContent className="p-6 md:p-8 prose prose-sm dark:prose-invert max-w-none">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">COOKIE POLICY</h1>
            <p className="text-muted-foreground mb-8">Last updated February 05, 2026</p>

            <p className="text-foreground">
              This Cookie Policy explains how Remelic ("Company," "we," "us," and "our") uses cookies and similar technologies to recognize you when you visit our website at https://remelic.com ("Website"). It explains what these technologies are and why we use them, as well as your rights to control our use of them.
            </p>

            <p className="text-foreground">
              In some cases we may use cookies to collect personal information, or that becomes personal information if we combine it with other information.
            </p>

            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">What are cookies?</h2>
            <p className="text-foreground">
              Cookies are small data files that are placed on your computer or mobile device when you visit a website. Cookies are widely used by website owners in order to make their websites work, or to work more efficiently, as well as to provide reporting information.
            </p>
            <p className="text-foreground">
              Cookies set by the website owner (in this case, Remelic) are called "first-party cookies." Cookies set by parties other than the website owner are called "third-party cookies." Third-party cookies enable third-party features or functionality to be provided on or through the website (e.g., advertising, interactive content, and analytics). The parties that set these third-party cookies can recognize your computer both when it visits the website in question and also when it visits certain other websites.
            </p>

            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">Why do we use cookies?</h2>
            <p className="text-foreground">
              We use first- and third-party cookies for several reasons. Some cookies are required for technical reasons in order for our Website to operate, and we refer to these as "essential" or "strictly necessary" cookies. Other cookies also enable us to track and target the interests of our users to enhance the experience on our Online Properties. Third parties serve cookies through our Website for advertising, analytics, and other purposes. This is described in more detail below.
            </p>

            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">How can I control cookies?</h2>
            <p className="text-foreground">
              You have the right to decide whether to accept or reject cookies. You can exercise your cookie rights by setting your preferences in the Cookie Consent Manager. The Cookie Consent Manager allows you to select which categories of cookies you accept or reject. Essential cookies cannot be rejected as they are strictly necessary to provide you with services.
            </p>
            <p className="text-foreground">
              The Cookie Consent Manager can be found in the notification banner and on our Website. If you choose to reject cookies, you may still use our Website though your access to some functionality and areas of our Website may be restricted. You may also set or amend your web browser controls to accept or refuse cookies.
            </p>

            <h3 className="text-lg font-semibold text-foreground mt-6 mb-3">Performance and functionality cookies:</h3>
            <p className="text-foreground">
              These cookies are used to enhance the performance and functionality of our Website but are non-essential to their use. However, without these cookies, certain functionality (like videos) may become unavailable.
            </p>
            <div className="bg-secondary/50 p-4 rounded-lg my-4">
              <p className="text-sm text-foreground"><strong>Name:</strong> rc::h</p>
              <p className="text-sm text-foreground"><strong>Provider:</strong> www.google.com</p>
              <p className="text-sm text-foreground"><strong>Service:</strong> <a href="https://business.safety.google/privacy/" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">View Service Privacy Policy</a></p>
              <p className="text-sm text-foreground"><strong>Type:</strong> html_local_storage</p>
              <p className="text-sm text-foreground"><strong>Expires in:</strong> persistent</p>
            </div>

            <h3 className="text-lg font-semibold text-foreground mt-6 mb-3">Advertising cookies:</h3>
            <p className="text-foreground">
              These cookies are used to make advertising messages more relevant to you. They perform functions like preventing the same ad from continuously reappearing, ensuring that ads are properly displayed for advertisers, and in some cases selecting advertisements that are based on your interests.
            </p>
            <div className="bg-secondary/50 p-4 rounded-lg my-4">
              <p className="text-sm text-foreground"><strong>Name:</strong> test_cookie</p>
              <p className="text-sm text-foreground"><strong>Purpose:</strong> A session cookie used to check if the user's browser supports cookies.</p>
              <p className="text-sm text-foreground"><strong>Provider:</strong> .doubleclick.net</p>
              <p className="text-sm text-foreground"><strong>Service:</strong> DoubleClick <a href="https://policies.google.com/privacy" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">View Service Privacy Policy</a></p>
              <p className="text-sm text-foreground"><strong>Type:</strong> server_cookie</p>
              <p className="text-sm text-foreground"><strong>Expires in:</strong> 900</p>
            </div>

            <h3 className="text-lg font-semibold text-foreground mt-6 mb-3">Unclassified cookies:</h3>
            <p className="text-foreground">
              These are cookies that have not yet been categorized. We are in the process of classifying these cookies with the help of their providers.
            </p>
            <div className="bg-secondary/50 p-4 rounded-lg my-4">
              <p className="text-sm text-foreground"><strong>Name:</strong> WMF-Uniq</p>
              <p className="text-sm text-foreground"><strong>Provider:</strong> .upload.wikimedia.org</p>
              <p className="text-sm text-foreground"><strong>Type:</strong> server_cookie</p>
              <p className="text-sm text-foreground"><strong>Expires in:</strong> 31478210</p>
            </div>

            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">How can I control cookies on my browser?</h2>
            <p className="text-foreground">
              As the means by which you can refuse cookies through your web browser controls vary from browser to browser, you should visit your browser's help menu for more information. The following is information about how to manage cookies on the most popular browsers:
            </p>
            <ul className="list-disc pl-6 my-4 text-foreground">
              <li><a href="https://support.google.com/chrome/answer/95647" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Chrome</a></li>
              <li><a href="https://support.microsoft.com/en-us/help/17442/windows-internet-explorer-delete-manage-cookies" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Internet Explorer</a></li>
              <li><a href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Firefox</a></li>
              <li><a href="https://support.apple.com/guide/safari/manage-cookies-and-website-data-sfri11471/mac" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Safari</a></li>
              <li><a href="https://support.microsoft.com/en-us/help/4027947/microsoft-edge-delete-cookies" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Edge</a></li>
              <li><a href="https://help.opera.com/en/latest/web-preferences/#cookies" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Opera</a></li>
            </ul>
            <p className="text-foreground">
              In addition, most advertising networks offer you a way to opt out of targeted advertising. If you would like to find out more information, please visit:
            </p>
            <ul className="list-disc pl-6 my-4 text-foreground">
              <li><a href="https://www.aboutads.info/choices/" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Digital Advertising Alliance</a></li>
              <li><a href="https://youradchoices.ca/" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Digital Advertising Alliance of Canada</a></li>
              <li><a href="https://www.youronlinechoices.eu/" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">European Interactive Digital Advertising Alliance</a></li>
            </ul>

            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">What about other tracking technologies, like web beacons?</h2>
            <p className="text-foreground">
              Cookies are not the only way to recognize or track visitors to a website. We may use other, similar technologies from time to time, like web beacons (sometimes called "tracking pixels" or "clear gifs"). These are tiny graphics files that contain a unique identifier that enables us to recognize when someone has visited our Website or opened an email including them. This allows us, for example, to monitor the traffic patterns of users from one page within a website to another, to deliver or communicate with cookies, to understand whether you have come to the website from an online advertisement displayed on a third-party website, to improve site performance, and to measure the success of email marketing campaigns. In many instances, these technologies are reliant on cookies to function properly, and so declining cookies will impair their functioning.
            </p>

            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">Do you use Flash cookies or Local Shared Objects?</h2>
            <p className="text-foreground">
              Websites may also use so-called "Flash Cookies" (also known as Local Shared Objects or "LSOs") to, among other things, collect and store information about your use of our services, fraud prevention, and for other site operations.
            </p>
            <p className="text-foreground">
              If you do not want Flash Cookies stored on your computer, you can adjust the settings of your Flash player to block Flash Cookies storage using the tools contained in the Website Storage Settings Panel. You can also control Flash Cookies by going to the Global Storage Settings Panel and following the instructions (which may include instructions that explain, for example, how to delete existing Flash Cookies (referred to "information" on the Macromedia site), how to prevent Flash LSOs from being placed on your computer without your being asked, and (for Flash Player 8 and later) how to block Flash Cookies that are not being delivered by the operator of the page you are on at the time).
            </p>
            <p className="text-foreground">
              Please note that setting the Flash Player to restrict or limit acceptance of Flash Cookies may reduce or impede the functionality of some Flash applications, including, potentially, Flash applications used in connection with our services or online content.
            </p>

            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">Do you serve targeted advertising?</h2>
            <p className="text-foreground">
              Third parties may serve cookies on your computer or mobile device to serve advertising through our Website. These companies may use information about your visits to this and other websites in order to provide relevant advertisements about goods and services that you may be interested in. They may also employ technology that is used to measure the effectiveness of advertisements. They can accomplish this by using cookies or web beacons to collect information about your visits to this and other sites in order to provide relevant advertisements about goods and services of potential interest to you. The information collected through this process does not enable us or them to identify your name, contact details, or other details that directly identify you unless you choose to provide these.
            </p>

            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">How often will you update this Cookie Policy?</h2>
            <p className="text-foreground">
              We may update this Cookie Policy from time to time in order to reflect, for example, changes to the cookies we use or for other operational, legal, or regulatory reasons. Please therefore revisit this Cookie Policy regularly to stay informed about our use of cookies and related technologies.
            </p>
            <p className="text-foreground">
              The date at the top of this Cookie Policy indicates when it was last updated.
            </p>

            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">Where can I get further information?</h2>
            <p className="text-foreground">
              If you have any questions about our use of cookies or other technologies, please email us at <a href="mailto:henrikremelic@gmail.com" className="text-primary hover:underline">henrikremelic@gmail.com</a> or by post to:
            </p>
            <address className="not-italic text-foreground mt-4">
              Remelic<br />
              Oslo, Oslo 0373<br />
              Norway
            </address>

            <p className="text-muted-foreground text-sm mt-8 pt-4 border-t border-border">
              This Cookie Policy was created using Termly's Cookie Consent Manager
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default CookiePolicy;
