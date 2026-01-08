document.addEventListener('DOMContentLoaded',()=>{
  const toggle=document.querySelector('.nav-toggle');
  const nav=document.querySelector('.nav');
  if(toggle && nav){
    toggle.addEventListener('click',()=>nav.classList.toggle('show'))
  }
  const revealEls=document.querySelectorAll('.card, .service-item, .carousel, .hero, .content, .contact-form');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        io.unobserve(e.target);
      }
    });
  });
  revealEls.forEach(el => { el.classList.add('reveal'); io.observe(el); });

  // Sections: fade out when leaving, fade in when centered — toggle `in-view` on main > section
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const el = entry.target;
      // consider section in-view when >= 45% visible
      if (entry.intersectionRatio >= 0.45) el.classList.add('in-view');
      else el.classList.remove('in-view');
    });
  }, { threshold: [0, 0.15, 0.45, 0.75, 1] });
  document.querySelectorAll('main > section').forEach(s => sectionObserver.observe(s));

  // Pin the `about-cta` to center when user reaches bottom and it's visible;
  // unpin when the user scrolls up.
  (function(){
    const about = document.querySelector('.about-cta');
    if(!about) return;
    let placeholder = null;
    let centered = false;
    let lastY = window.scrollY;
    let lastToggle = 0;

    function isAtBottom(){
      const doc = document.documentElement;
      return (window.innerHeight + window.scrollY) >= (doc.scrollHeight - 6);
    }

    function isVisible(el){
      const r = el.getBoundingClientRect();
      return r.top < window.innerHeight && r.bottom > 0;
    }

    function setCentered(on){
      if(on === centered) return;
      if(on){
        // compute distance to slightly-above-center of viewport and translate the element there via transform
        const rect = about.getBoundingClientRect();
        // nudge up by ~6% of viewport height so it sits a bit higher than true center
        const nudge = Math.round(window.innerHeight * 0.06);
        const targetY = Math.round((window.innerHeight - rect.height) / 2 - nudge);
        const dy = targetY - rect.top;

        // ensure smooth GPU-accelerated animation
        about.style.transition = 'transform .8s cubic-bezier(.16,.84,.25,1), opacity .35s ease';
        about.style.willChange = 'transform,opacity';
        about.classList.add('centered');

        // apply transform
        requestAnimationFrame(()=>{ about.style.transform = `translate3d(0, ${dy}px, 0)`; });
      } else {
        // animate back to original position
        about.style.transition = 'transform .6s cubic-bezier(.16,.84,.25,1), opacity .2s ease';
        requestAnimationFrame(()=>{ about.style.transform = ''; });

        const cleanup = ()=>{
          about.classList.remove('centered');
          about.style.transition = '';
          about.style.willChange = '';
          about.removeEventListener('transitionend', cleanup);
        };
        about.addEventListener('transitionend', cleanup);
      }
      centered = on;
    }

    window.addEventListener('scroll', ()=>{
      const y = window.scrollY;
      const dy = y - lastY;
      const now = Date.now();
      const upThreshold = -10; // pixels scrolled up
      lastY = y;

      // cooldown to avoid rapid toggles
      if(now - lastToggle < 180) return;

      // if the page is at the bottom and the about element is visible, center it
      if(isAtBottom() && isVisible(about) && !centered){
        setCentered(true);
        lastToggle = now;
      }

      // if user scrolls up sufficiently while centered, release it
      if(dy < upThreshold && centered){
        setCentered(false);
        lastToggle = now;
      }

      // if it becomes not visible for any reason, unpin
      if(!isVisible(about) && centered){
        setCentered(false);
        lastToggle = now;
      }
    }, {passive:true});

    window.addEventListener('resize', ()=>{ if(centered) setCentered(false); });
  })();

  document.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();document.querySelector(a.getAttribute('href'))?.scrollIntoView({behavior:'smooth'})}))

  const interactiveCards = document.querySelectorAll('.services-preview .card.interactive, .carousel');
  interactiveCards.forEach(card=>{
    let rect = null;
    function onMove(e){
      rect = card.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const cx = rect.width/2;
      const cy = rect.height/2;
      const dx = (px - cx) / cx;
      const dy = (py - cy) / cy;
      const clamp = v => Math.max(-1, Math.min(1, v));
      const rx = clamp(dy) * 8;
      const ry = clamp(dx) * 8;
      card.style.transform = `perspective(900px) rotateX(${ -rx }deg) rotateY(${ ry }deg) scale(1.02)`;
      card.style.boxShadow = `0 ${12 + Math.abs(dy*6)}px ${30 + Math.abs(dx*8)}px rgba(0,0,0,0.75)`;
    }
    function onLeave(){
      card.style.transition = 'transform .8s cubic-bezier(.16,.84,.25,1), box-shadow .8s cubic-bezier(.16,.84,.25,1)';
      card.style.transform = '';
      card.style.boxShadow = '';
      setTimeout(()=>{card.style.transition='transform .18s ease,box-shadow .18s ease';},500);
    }
    card.addEventListener('mousemove', onMove);
    card.addEventListener('mouseenter', e=>{card.style.transition = 'transform .12s linear';});
    card.addEventListener('mouseleave', onLeave);
  });

  (function(){
    const carousel = document.querySelector('.carousel');
    if(!carousel) return;
    const track = carousel.querySelector('.carousel-track');
    const slides = Array.from(track.querySelectorAll('.carousel-slide'));
    const prev = carousel.querySelector('.carousel-prev');
    const next = carousel.querySelector('.carousel-next');
    let idx = 0;
    let timer = null;
    const go = i=>{
      idx = (i + slides.length) % slides.length;
      track.style.transform = `translateX(${-idx * 100}%)`;
    };
    const nextSlide = ()=> go(idx+1);
    const prevSlide = ()=> go(idx-1);
    next?.addEventListener('click', ()=>{nextSlide(); resetTimer();});
    prev?.addEventListener('click', ()=>{prevSlide(); resetTimer();});
    carousel.addEventListener('mouseenter', ()=>{clearInterval(timer);timer=null});
    carousel.addEventListener('mouseleave', ()=>{startTimer()});
    function startTimer(){ if(timer) return; timer=setInterval(nextSlide,4000); }
    function resetTimer(){ clearInterval(timer); timer=null; startTimer(); }
    
    go(0);
    startTimer();
  })();
  
  const contactHero = document.querySelector('.contact-hero');
  if(contactHero){
    let last = 0;
    window.addEventListener('scroll', ()=>{
      last = window.scrollY * 0.08;
      contactHero.style.transform = `translateY(${last}px)`;
    }, {passive:true});
  }
  
  const contactForm = document.getElementById('contactForm');
  if(contactForm){
    const feedback = document.getElementById('contact-feedback');
    contactForm.addEventListener('submit', async (e)=>{
      e.preventDefault();
      feedback.textContent = '';
      const submitBtn = contactForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending...';
      const formData = new FormData(contactForm);
      try{
        const res = await fetch('https://formsubmit.co/ajax/nickglessner@gmail.com', {
          method: 'POST',
          body: formData,
          headers: { 'Accept': 'application/json' }
        });
        const data = await res.json();
        if(res.ok){
          feedback.textContent = 'Message sent — thank you!';
          feedback.style.color = 'white';
          contactForm.reset();
        } else {
          feedback.textContent = data.message || 'There was an error sending the message.';
          feedback.style.color = '#f66';
        }
      }catch(err){
        feedback.textContent = 'Unable to send message. Please try again or email nickglessner@gmail.com directly.';
        feedback.style.color = '#f66';
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Message';
      }
    });
  }

  // bottom scroll progress bar: create element and update width on scroll
  (function(){
    const progressContainer = document.createElement('div');
    progressContainer.className = 'scroll-progress-container';
    const progressBar = document.createElement('div');
    progressBar.className = 'scroll-progress-bar';
    progressContainer.appendChild(progressBar);
    document.body.appendChild(progressContainer);

    function updateProgress(){
      const doc = document.documentElement;
      const scrollTop = window.pageYOffset || doc.scrollTop || 0;
      const height = Math.max(doc.scrollHeight - doc.clientHeight, 1);
      const pct = Math.min(100, Math.max(0, (scrollTop / height) * 100));
      progressBar.style.width = pct + '%';
    }

    let ticking = false;
    window.addEventListener('scroll', ()=>{
      if(!ticking){
        window.requestAnimationFrame(()=>{ updateProgress(); ticking = false; });
        ticking = true;
      }
    }, {passive:true});
    // initialize
    updateProgress();
  })();
});
