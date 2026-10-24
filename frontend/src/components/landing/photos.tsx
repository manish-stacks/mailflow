'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Heading, Section } from './ui';
import { Item, Stagger } from './motion';

const u = (id: string, w = 900) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=75`;

/** Unsplash demo photography. Swap for your own brand imagery before launch. */
const PHOTOS = [
  { id: 'photo-1522071820081-009f0129c71c', title: 'Plan campaigns together', text: 'Invite your team, assign roles and keep every send organized.', alt: 'Team collaborating around a table with laptops', span: 'lg:col-span-2 lg:row-span-2', h: 'h-72 lg:h-full' },
  { id: 'photo-1460925895917-afdab827c52f', title: 'Read the results', text: 'Opens, clicks and bounces in one view.', alt: 'Laptop showing analytics charts on a desk', span: '', h: 'h-56' },
  { id: 'photo-1556761175-5973dc0f32e7', title: 'Run it for every client', text: 'Separate workspaces and senders for each brand.', alt: 'Colleagues in a business meeting', span: '', h: 'h-56' },
  { id: 'photo-1551434678-e076c223a692', title: 'Build on the API', text: 'Connect email to your own products.', alt: 'Developers working at their computers', span: '', h: 'h-56' },
  { id: 'photo-1454165804606-c3d57bc86b40', title: 'Launch with confidence', text: 'Preview, review, then send.', alt: 'Desk with laptop and charts', span: '', h: 'h-56' },
];

function Photo({ id, alt, className }: { id: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <div className={`${className} bg-gradient-to-br from-hm-bg to-hm-line`} role="img" aria-label={alt} />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={u(id)} alt={alt} loading="lazy" decoding="async" onError={() => setFailed(true)} className={`${className} object-cover`} />;
}

export function PhotoSection() {
  return (
    <Section id="teams-at-work" tone="gray">
      <Heading eyebrow="Built for teams" title="Email Marketing That Fits How You Work" copy="From solo founders to agencies managing many brands — one workspace for planning, creating, sending and learning." />
      <Stagger className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-[repeat(2,minmax(0,1fr))]">
        {PHOTOS.map((p) => (
          <Item key={p.id} className={`group relative overflow-hidden rounded-2xl border border-hm-line bg-hm-bg ${p.span}`}>
            <motion.div className="h-full" whileHover={{ scale: 1.03 }} transition={{ duration: 0.5 }}>
              <Photo id={p.id} alt={p.alt} className={`w-full ${p.h}`} />
            </motion.div>
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-hm-ink/80 via-hm-ink/10 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5 text-white">
              <p className="text-base font-semibold">{p.title}</p>
              <p className="mt-1 text-sm leading-snug text-white/80">{p.text}</p>
            </div>
          </Item>
        ))}
      </Stagger>
      <p className="mt-4 text-center text-xs text-hm-gray">Demo photography via <a className="underline underline-offset-2 hover:text-hm-ink" href="https://unsplash.com" target="_blank" rel="noopener noreferrer">Unsplash</a>. Images are illustrative and do not depict HoverMail customers.</p>
    </Section>
  );
}
