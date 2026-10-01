import type { ReactNode } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeaderHost } from "@/components/site-header-host";
import { SiteFrame } from "@/components/chrome/site-frame";
import { CookieBanner } from "@/components/legal/cookie-banner";
import { CornerDock } from "@/components/chrome/corner-dock";
import { AnalyticsLoader } from "@/components/legal/analytics-loader";
import { LocaleProvider } from "@/components/chrome/locale-provider";
import { THEME_BOOT } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export async function AuthChrome({ children }: { children: ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale} className={`${jakarta.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
      </head>
      <body className="flex min-h-full flex-col text-slate-900">
        <script
          dangerouslySetInnerHTML={{
            __html:
              "document.addEventListener('toggle',function(e){var d=e.target;if(!d||!d.classList||!d.classList.contains('menu-disclosure'))return;var s=d.querySelector('summary');if(!s)return;s.setAttribute('aria-label',d.open?s.getAttribute('data-close'):s.getAttribute('data-open'));},true);document.addEventListener('click',function(e){if(document.documentElement.dataset.hydrated==='yes')return;var t=e.target&&e.target.closest?e.target.closest('[data-dictate]'):null;if(!t)return;var root=t.closest('[data-mint-ask]');if(!root)return;var field=root.querySelector('textarea');var status=root.querySelector('[data-dictate-status]');if(!field)return;var wave=t.getAttribute('data-dictate')==='wave';if(wave&&field.value.trim()&&root.dataset.listening!=='1')return;if(root.dataset.listening==='1'){if(root.__mintSession)root.__mintSession.stop();root.dataset.listening='';if(status)status.textContent='';return;}var Host=window.SpeechRecognition||window.webkitSpeechRecognition;if(!Host){if(status)status.textContent='La dictée n\\u2019est pas disponible ici.';return;}var session=new Host();root.__mintSession=session;session.lang=document.documentElement.lang==='en'?'en-US':'fr-FR';session.interimResults=true;var base=field.value.trim();session.onresult=function(ev){var spoken='';for(var i=0;i<ev.results.length;i++)spoken+=(ev.results[i][0].transcript||'')+' ';var next=spoken.replace(/\\s+/g,' ').trim();field.value=base?(next?base+' '+next:base):next;field.style.height='0px';field.style.height=Math.min(field.scrollHeight,120)+'px';field.dispatchEvent(new Event('input',{bubbles:true}));};session.onend=function(){root.dataset.listening='';if(status)status.textContent='';};function begin(){root.dataset.listening='1';if(status)status.textContent='J\\u2019écoute…';try{session.start();}catch(err){root.dataset.listening='';if(status)status.textContent='La dictée n\\u2019est pas disponible ici.';}}if(navigator.mediaDevices&&navigator.mediaDevices.getUserMedia){navigator.mediaDevices.getUserMedia({audio:true}).then(function(stream){stream.getTracks().forEach(function(track){track.stop();});begin();}).catch(function(){if(status)status.textContent='Autorise le micro pour dicter.';});}else begin();},true);",
          }}
        />
        <LocaleProvider locale={locale}>
          <SiteFrame header={<SiteHeaderHost />} footer={<SiteFooter />}>
            {children}
          </SiteFrame>
          <CornerDock referral />
          <CookieBanner />
          <AnalyticsLoader domain={process.env.NEXT_PUBLIC_ANALYTICS_DOMAIN} />
        </LocaleProvider>
      </body>
    </html>
  );
}
