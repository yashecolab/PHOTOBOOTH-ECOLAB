"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Camera,
  Check,
  CirclePlay,
  Download,
  Images,
  LayoutTemplate,
  Sparkles,
  Users,
  WandSparkles
} from "lucide-react";
import { RecentMemoryTile, TemplateCard } from "@/components/TemplateCard";
import { useFrameTemplates } from "@/hooks/useFrameTemplates";

const steps = [
  { icon: LayoutTemplate, title: "Choose your frame", description: "Pick a design that fits your event, from Ecolab blue to hackathon energy." },
  { icon: Camera, title: "Strike a pose", description: "Allow camera access and let the booth capture four moments automatically." },
  { icon: WandSparkles, title: "Make it yours", description: "Add your name, event, date, and a few playful stickers to your strip." },
  { icon: Download, title: "Keep the memory", description: "Download a crisp PNG, JPG, or PDF. Your photos stay right here on your device." }
];

export default function HomePage() {
  const { frames } = useFrameTemplates();
  const visibleFrames = frames.filter((frame) => frame.enabled);

  return (
    <>
      <section className="hero">
        <div className="hero-inner">
          <motion.div
            className="hero-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: .65, ease: "easeOut" }}
          >
            <div className="hero-pill"><span /> YOUR MOMENT, YOUR MASTERPIECE</div>
            <h1>Ecolab Digital Center <em>Photobooth</em></h1>
            <p className="hero-subtitle">Capture memories. Celebrate innovation. Share moments.<br />A little joy from the people who make it happen.</p>
            <div className="hero-actions">
              <Link href="/booth" className="button button-primary"><Camera size={17} /> Start photo booth <ArrowRight size={16} /></Link>
              <Link href="/gallery" className="button button-secondary"><Images size={17} /> Explore gallery</Link>
            </div>
            <div className="hero-trust">
              <div className="trust-dots" aria-hidden="true"><span>A</span><span>R</span><span>K</span><span>+</span></div>
              <span>Made for our moments at Ecolab Digital Center</span>
            </div>
          </motion.div>
          <motion.div
            className="hero-art"
            initial={{ opacity: 0, scale: .94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: .8, delay: .15 }}
            aria-label="Illustration of a custom EDC photo strip"
            role="img"
          >
            <div className="hero-orbit" />
            <span className="hero-spark one">✦</span><span className="hero-spark two">✳</span>
            <div className="float-card top"><Sparkles size={17} /> A moment worth keeping</div>
            <div className="hero-card hero-card-left" aria-hidden="true">
              <div className="photo-placeholder"><Users size={28} /></div>
              <div className="photo-placeholder second"><CirclePlay size={26} /></div>
              <div className="mini-strip-footer">#EDCMOMENTS</div>
            </div>
            <div className="hero-card hero-card-right" aria-hidden="true">
              <div className="photo-placeholder second"><Sparkles size={27} /></div>
              <div className="photo-placeholder"><Users size={28} /></div>
              <div className="mini-strip-footer">BETTER TOGETHER</div>
            </div>
            <div className="hero-card hero-card-main" aria-hidden="true">
              <div className="photo-placeholder"><Users size={32} /></div>
              <div className="photo-placeholder second"><CirclePlay size={29} /></div>
              <div className="photo-placeholder third"><Sparkles size={25} /></div>
              <div className="mini-strip-footer">ECOLAB · DIGITAL CENTER</div>
            </div>
            <div className="float-card bottom"><Check size={16} /> Made for your team</div>
          </motion.div>
        </div>
      </section>

      <section className="how-section">
        <div className="page-wrap">
          <div className="section-heading">
            <span className="section-kicker">A little magic, made simple</span>
            <h2 className="section-title">Four steps to a forever moment.</h2>
            <p className="section-description">No queues, no complicated setup. Just you, your team, and a keepsake worth sharing.</p>
          </div>
          <div className="steps-grid">
            {steps.map((step, index) => (
              <motion.article
                className="step-card"
                key={step.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: .3 }}
                transition={{ delay: index * .07, duration: .4 }}
              >
                <span className="step-number">0{index + 1}</span>
                <span className="step-icon"><step.icon size={19} /></span>
                <h3>{step.title}</h3><p>{step.description}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="templates-section" id="templates">
        <div className="page-wrap">
          <div className="templates-header">
            <div>
              <span className="section-kicker">Made for every kind of day</span>
              <h2 className="section-title">Find your frame.</h2>
              <p className="section-description">A little personality for every celebration, milestone, and big idea.</p>
            </div>
            <Link href="/booth" className="button button-secondary">See them all <ArrowRight size={15} /></Link>
          </div>
          <div className="template-grid">
            {visibleFrames.map((template) => <TemplateCard key={template.id} template={template} />)}
          </div>
        </div>
      </section>

      <section className="memories-section">
        <div className="page-wrap">
          <div className="memories-row">
            <div><span className="section-kicker">The good stuff</span><h2 className="section-title">Recent memories.</h2></div>
            <Link href="/gallery" className="button button-secondary">View gallery <ArrowRight size={15} /></Link>
          </div>
          <div className="memory-grid">
            <RecentMemoryTile title="Innovation Day" date="A day full of big ideas" />
            <RecentMemoryTile title="Data Engineering Summit" date="Builders behind the bytes" />
            <RecentMemoryTile title="Hackathon 2026" date="Making it happen together" />
            <RecentMemoryTile title="Team Townhall" date="One team, many stories" />
          </div>
          <div className="cta-band">
            <div><h2>Your next great moment is one click away.</h2><p>Gather your team. We’ll take care of the keepsake.</p></div>
            <Link href="/booth" className="button"><Camera size={16} /> Let’s take a photo <ArrowRight size={16} /></Link>
          </div>
        </div>
      </section>
    </>
  );
}
