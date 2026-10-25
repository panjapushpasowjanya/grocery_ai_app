import { useState } from "react";
import { jsPDF } from "jspdf";
export default function Navbar({ setActivePage, onLogout, user,groceryItems }) {
    const [showShareMenu, setShowShareMenu] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const totalItems = groceryItems.length;
    const appLink = window.location.href;

const shareWhatsApp = () => {
  window.open(
    `https://wa.me/?text=${encodeURIComponent(
      `Check out my Smart Grocery AI report: ${appLink}`
    )}`,
    "_blank"
  );
};

const shareEmail = () => {
  window.open(
    `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(
      "Smart Grocery AI Report"
    )}&body=${encodeURIComponent(
      `Check out my Smart Grocery AI report: ${appLink}`
    )}`,
    "_blank"
  );
};

const shareSMS = () => {
  const isMobile =
    /Android|iPhone|iPad|iPod/i.test(
      navigator.userAgent
    );

  if (isMobile) {
    window.location.href =
      `sms:?body=` +
      encodeURIComponent(
        `Check out my Smart Grocery AI report: ${appLink}`
      );
  } else {
    alert(
      "SMS sharing works on mobile phones. Please open this app on your phone to send an SMS."
    );
  }
};

const shareTelegram = () => {
  window.open(
    `https://t.me/share/url?url=${encodeURIComponent(appLink)}`,
    "_blank"
  );
};

const copyLink = async () => {
  await navigator.clipboard.writeText(appLink);
  alert("Link copied!");
};

const copyReport = async () => {
  await navigator.clipboard.writeText(
    "Smart Grocery AI Report"
  );
  alert("Report copied!");
};

const downloadReport = () => {
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text("GROCERY LIST REPORT", 10, 15);

  let y = 30;

  groceryItems.forEach((item) => {
    doc.text(
      `${item.item_name} - ${item.quantity} ${item.unit}`,
      10,
      y
    );

    y += 10;
  });

  doc.save("grocery_report.pdf");
};
const navButtonStyle = {
    padding: '8px 16px',
    border: '1px solid #e8eaed',
    borderRadius: '8px',
    background: '#fff',
    cursor: 'pointer',
    fontSize: '14px',
    minWidth: '100px', 
    textAlign: 'center',
    transition: 'all 0.2s'
  };

  return (
    <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 20px', background: '#fff', borderBottom: '1px solid #e8eaed' }}>
      <h2 style={{ fontSize: '20px', margin: 0 }}>Smart Grocery AI</h2>
      
      <div id="profileArea" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <button style={navButtonStyle} onClick={() => setActivePage('home')}>Home</button>
        <button style={navButtonStyle} onClick={() => setActivePage('expenses')}>Expenses</button>
        <button style={navButtonStyle} onClick={() => setActivePage('health')}>Health</button>
        <button style={navButtonStyle} onClick={() => setActivePage('budget')}>Budget</button>
        <button style={navButtonStyle} onClick={() => setActivePage('diet')}>Diet</button>
        <button style={navButtonStyle} onClick={() => setActivePage('trends')}>Trends</button>
        
        {/* Share Button */}
        <button style={{...navButtonStyle, background: '#f0f4f8'}} onClick={() => setShowShareMenu(!showShareMenu)}>Share</button>
        <button style={navButtonStyle} onClick={downloadReport}>Download</button>
        <div style={{ position: 'relative' }}>
          <button style={navButtonStyle} onClick={() => setShowProfileMenu(!showProfileMenu)}>
            👤 {user?.name || 'Profile'}
          </button>
          
          {showProfileMenu && (
            <div style={{ 
              position: 'absolute', top: '45px', right: '0', background: '#fff', 
              padding: '15px', borderRadius: '12px', border: '1px solid #e8eaed',
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)', width: '200px', zIndex: 1000
            }}>
              <p style={{ margin: '0 0 5px 0', fontSize: '14px', fontWeight: 'bold' }}>{user?.name}</p>
              <p style={{ margin: '0 0 15px 0', fontSize: '12px', color: '#666' }}>Total Items: {totalItems}</p>
              <hr style={{ border: '0', borderTop: '1px solid #eee', margin: '10px 0' }} />
              
              {user && (
                <button 
                  onClick={() => { setShowProfileMenu(false); onLogout(); }} 
                  style={{ width: '100%', padding: '8px', background: '#d93025', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Logout
                </button>
              )}
            </div>
          )}
        </div>
        {showShareMenu && (
          <div style={{ 
            position: 'absolute', 
            top: '50px', 
            right: '20px', 
            background: '#fff', 
            border: '1px solid #e8eaed', 
            borderRadius: '12px', 
            padding: '16px', 
            zIndex: 1000,
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '12px',
            width: '220px'
          }}>
          {[
            { label: 'Copy Link', icon: '🔗', action: copyLink },
            { label: 'WhatsApp', icon: '💬', action: shareWhatsApp },
            { label: 'Gmail', icon: '✉️', action: shareEmail },
            { label: 'SMS', icon: '📱', action: shareSMS },
            { label: 'Telegram', icon: '✈️', action: shareTelegram },
            { label: 'Copy Report', icon: '📋', action: copyReport },
          ].map((item, index) => (
          <button 
            key={index} 
            onClick={item.action} 
            style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            padding: '10px', 
            border: 'none', 
            background: '#f8f9fa', 
            borderRadius: '8px', 
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '500',
            transition: 'background 0.2s'
          }}
          onMouseOver={(e) => e.target.style.background = '#eef0f2'}
          onMouseOut={(e) => e.target.style.background = '#f8f9fa'}
        >
        <span style={{ fontSize: '20px', marginBottom: '4px' }}>{item.icon}</span>
        {item.label}
      </button>
    ))}
  </div>
)}

</div>
</nav>
  );
}