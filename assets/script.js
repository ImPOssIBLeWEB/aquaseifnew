(() => {
  const header = document.getElementById('site-header');
  const menuButton = document.querySelector('.menu-toggle');
  const menu = document.getElementById('nav');
  const updateHeader = () => header.classList.toggle('scrolled', window.scrollY > 16);
  window.addEventListener('scroll', updateHeader, { passive:true }); updateHeader();
  const closeMenu = () => { menu.classList.remove('open'); menuButton.setAttribute('aria-expanded','false'); menuButton.setAttribute('aria-label','Открыть меню'); };
  menuButton.addEventListener('click', () => { const open = menu.classList.toggle('open');menuButton.setAttribute('aria-expanded',String(open));menuButton.setAttribute('aria-label',open?'Закрыть меню':'Открыть меню'); });
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click',closeMenu));
  document.addEventListener('keydown', event => {if(event.key==='Escape') {closeMenu();closeLightbox();}});
  document.getElementById('year').textContent=String(new Date().getFullYear());

  const more = document.getElementById('more-photos'); const extra=document.getElementById('extra-gallery');
  more.addEventListener('click', () => {let show=extra.hidden; extra.hidden=!show;more.setAttribute('aria-expanded',String(show));more.innerHTML=show?'Скрыть фотографии <span>↑</span>':'Показать ещё фотографии <span>↓</span>';});

  const lightbox=document.getElementById('lightbox');const lightboxImage=lightbox.querySelector('img');const lightboxClose=lightbox.querySelector('.lightbox-close');let lastFocus=null;
  function closeLightbox(){if(lightbox.hidden)return; lightbox.hidden=true;document.body.classList.remove('no-scroll');lightboxImage.removeAttribute('src');lastFocus?.focus();}
  document.querySelectorAll('[data-lightbox]').forEach(link=>link.addEventListener('click',ev=>{ev.preventDefault();lastFocus=link;lightboxImage.src=link.href;lightboxImage.alt=link.querySelector('img')?.alt||'Фотография объекта';lightbox.hidden=false;document.body.classList.add('no-scroll');lightboxClose.focus();}));
  lightboxClose.addEventListener('click',closeLightbox);lightbox.addEventListener('click',ev=>{if(ev.target===lightbox)closeLightbox();});

  const form=document.getElementById('lead-form');const params=new URLSearchParams(window.location.search);
  ['utm_source','utm_medium','utm_campaign','utm_content','utm_term','yclid'].forEach(key=>{const element=form.elements.namedItem(key);if(element)element.value=(params.get(key)||'').slice(0,200);});
  // Intentionally disabled until a tested server-side MAX integration and privacy policy are configured.
  form.addEventListener('submit',e=>e.preventDefault());

  if('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    const elements=document.querySelectorAll('.section-heading,.problem,.service-item,.engineering-grid,.portfolio-card,.about-copy,.faq-list');
    elements.forEach(e=>e.classList.add('reveal'));
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target);}}),{threshold:.06,rootMargin:'0px 0px -30px 0px'});elements.forEach(e=>observer.observe(e));
  }
})();
