import React from 'react';

export default function About() {
  return (
    <div className="page active">
      <div className="about-page">
        <h1>About Smile Source</h1>
        <p>Smile Source Dental Supply LLC is a Pennsylvania-based wholesale distributor connecting dental clinics, specialty labs, and healthcare providers across the United States with premium dental products at competitive volume pricing.</p>
        <p>We bridge certified manufacturers and importers with the dental professionals who depend on consistent, reliable supply chains. Our team brings direct industry experience to every partnership — from sourcing and compliance to logistics and customer support.</p>
        <p><strong>For manufacturers and suppliers:</strong> We offer consistent purchase volumes, a growing customer network, and full compliance transparency including our LLC registration, EIN, and product liability documentation available on request.</p>
        <div style={{ marginTop: '32px', background: 'var(--teal-bg)', border: '1px solid rgba(8,145,178,0.2)', borderRadius: '12px', padding: '24px' }}>
          <strong style={{ fontFamily: "'Syne',sans-serif", color: 'var(--navy)' }}>Contact Us</strong>
          <p style={{ marginTop: '10px', marginBottom: 0 }}>📧 smilesourcesupply@gmail.com</p>
          <p style={{ marginTop: '5px', marginBottom: 0 }}>📍 801 Upland Ave Suite B, Upland, PA 19013</p>
        </div>
      </div>
    </div>
  );
}
