(() => {
  const header = document.getElementById('site-header');
  const menuButton = document.querySelector('.menu-toggle');
  const menu = document.getElementById('nav');
  const updateHeader = () => header.classList.toggle('scrolled', window.scrollY > 16);
  window.addEventListener('scroll', updateHeader, { passive:true }); updateHeader();
  const closeMenu = () => { menu.classList.remove('open'); menuButton.setAttribute('aria-expanded','false'); menuButton.setAttribute('aria-label','Открыть меню'); };
  menuButton.addEventListener('click', () => { const open = menu.classList.toggle('open');menuButton.setAttribute('aria-expanded',String(open));menuButton.setAttribute('aria-label',open?'Закрыть меню':'Открыть меню'); });
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click',closeMenu));
  document.addEventListener('pointerdown', event => { if (menu.classList.contains('open') && !menu.contains(event.target) && !menuButton.contains(event.target)) closeMenu(); });
  window.matchMedia('(min-width: 981px)').addEventListener('change', event => { if (event.matches) closeMenu(); });
  document.addEventListener('keydown', event => {if(event.key==='Escape') {closeMenu();closeLightbox();}});
  document.getElementById('year').textContent=String(new Date().getFullYear());
  const diagram=document.querySelector('.diagram-card[data-stage]');
  const stageCopy=document.getElementById('diagram-stage-copy');
  const stageText={
    water:'Вода движется от влажного грунта по раскрытию трещины. Переключите схему, чтобы увидеть принцип инъекционного заполнения.',
    sealed:'После подготовки каналов через пакеры подают инъекционный состав. Он заполняет заданную зону дефекта и ограничивает путь воды; технологию выбирают после обследования.'
  };
  document.querySelectorAll('[data-diagram-stage]').forEach(button=>button.addEventListener('click',()=>{
    const stage=button.dataset.diagramStage;
    if (!Object.hasOwn(stageText,stage)) return;
    diagram.dataset.stage=stage;
    stageCopy.textContent=stageText[stage];
    document.querySelectorAll('[data-diagram-stage]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
  }));

  const more = document.getElementById('more-photos'); const extra=document.getElementById('extra-gallery');
  more.addEventListener('click', () => {let show=extra.hidden; extra.hidden=!show;more.setAttribute('aria-expanded',String(show));more.innerHTML=show?'Скрыть фотографии <span>↑</span>':'Показать ещё фотографии <span>↓</span>';});

  const lightbox=document.getElementById('lightbox');
  const lightboxImage=lightbox.querySelector('img');
  const lightboxClose=lightbox.querySelector('.lightbox-close');
  const lightboxPrev=lightbox.querySelector('.lightbox-prev');
  const lightboxNext=lightbox.querySelector('.lightbox-next');
  const lightboxCounter=lightbox.querySelector('.lightbox-counter');
  const photos=[...document.querySelectorAll('[data-lightbox]')];
  const visiblePhotos=()=>photos.filter(link=>!link.closest('[hidden]'));
  let lastFocus=null,activePhoto=0,touchStartX=0;
  function showPhoto(index){
    const available=visiblePhotos();
    if(!available.length)return;
    activePhoto=(index+available.length)%available.length;
    const current=available[activePhoto];
    lightboxImage.src=current.href;
    lightboxImage.alt=current.querySelector('img')?.alt||'Фотография объекта';
    lightboxCounter.textContent=`${activePhoto+1} / ${available.length}`;
  }
  function closeLightbox(){
    if(lightbox.hidden)return;
    lightbox.hidden=true;
    document.body.classList.remove('no-scroll');
    lightboxImage.removeAttribute('src');
    lastFocus?.focus();
  }
  photos.forEach((link,index)=>link.addEventListener('click',event=>{
    event.preventDefault();
    lastFocus=link;
    showPhoto(visiblePhotos().indexOf(link));
    lightbox.hidden=false;
    document.body.classList.add('no-scroll');
    lightboxClose.focus();
  }));
  lightboxPrev.addEventListener('click',()=>showPhoto(activePhoto-1));
  lightboxNext.addEventListener('click',()=>showPhoto(activePhoto+1));
  lightboxClose.addEventListener('click',closeLightbox);
  lightbox.addEventListener('click',event=>{if(event.target===lightbox)closeLightbox();});
  lightbox.addEventListener('touchstart',event=>{touchStartX=event.changedTouches[0]?.screenX||0;},{passive:true});
  lightbox.addEventListener('touchend',event=>{const dx=(event.changedTouches[0]?.screenX||0)-touchStartX;if(Math.abs(dx)>55)showPhoto(activePhoto+(dx<0?1:-1));},{passive:true});
  document.addEventListener('keydown',event=>{
    if(lightbox.hidden)return;
    if(event.key==='ArrowRight'){event.preventDefault();showPhoto(activePhoto+1);}
    if(event.key==='ArrowLeft'){event.preventDefault();showPhoto(activePhoto-1);}
    if(event.key==='Tab'){
      const controls=[lightboxClose,lightboxPrev,lightboxNext];
      const index=controls.indexOf(document.activeElement);
      if(index<0){event.preventDefault();lightboxClose.focus();return;}
      if(event.shiftKey&&index===0){event.preventDefault();controls[controls.length-1].focus();}
      else if(!event.shiftKey&&index===controls.length-1){event.preventDefault();controls[0].focus();}
    }
  });

  // Asset-dependent blocks are hidden until the uploaded WebP files are available.
  // This avoids broken photos on the published Pages demo before manual upload.
  const imageAvailable = src => new Promise(resolve => {
    const test = new Image();
    test.onload = () => resolve(true);
    test.onerror = () => resolve(false);
    test.src = src;
  });
  window.addEventListener('load', () => {
    const caseSection = document.getElementById('case-studies');
    document.querySelectorAll('.case-study[data-preflight]').forEach(article => {
      const files = article.dataset.preflight.split(',').map(name => 'assets/images/' + name.trim());
      Promise.all(files.map(imageAvailable)).then(loaded => {
        if(loaded.every(Boolean)){
          article.hidden = false;
          caseSection.hidden = false;
        }
      });
    });
    const specialistSection = document.getElementById('specialist');
    Promise.all([
      'assets/images/alexey-kuznetsov.webp',
      'assets/images/alexey-qualification-certificate.webp',
      'assets/images/alexey-qualification-protocol.webp'
    ].map(imageAvailable)).then(loaded => {
      if(loaded.every(Boolean)) specialistSection.hidden = false;
    });
  });

  const form=document.getElementById('lead-form');const params=new URLSearchParams(window.location.search);
  ['utm_source','utm_medium','utm_campaign','utm_content','utm_term','yclid'].forEach(key=>{const element=form.elements.namedItem(key);if(element)element.value=(params.get(key)||'').slice(0,200);});
  // GitHub Pages demo remains disabled; on a configured PHP host set data-forms-enabled=true.
  const formEnabled=document.documentElement.dataset.formsEnabled==='true';
  const button=form.querySelector('button[type="submit"]');
  const status=document.getElementById('form-status');
  if(formEnabled){
    button.disabled=false;
    button.innerHTML='Отправить заявку <span aria-hidden="true">↗</span>';
    status.textContent='После отправки мы свяжемся с вами по указанному телефону.';
  }
  form.addEventListener('submit',async event=>{
    event.preventDefault();
    if(!formEnabled||!form.reportValidity())return;
    button.disabled=true;
    const original=button.innerHTML;
    button.textContent='Отправляем...';
    status.textContent='Отправляем заявку...';
    try{
      const response=await fetch(form.action,{
        method:'POST',body:new FormData(form),credentials:'same-origin',
        headers:{Accept:'application/json'}
      });
      const result=await response.json();
      if(!response.ok||!result.success)throw new Error(result.message||'Заявка не доставлена.');
      status.textContent=result.message||'Заявка отправлена.';
      form.reset();
      ['utm_source','utm_medium','utm_campaign','utm_content','utm_term','yclid'].forEach(key=>{
        const element=form.elements.namedItem(key);
        if(element)element.value=(params.get(key)||'').slice(0,200);
      });
    }catch(error){
      status.textContent=(error instanceof Error&&error.message)||'Не удалось отправить заявку. Позвоните нам.';
    }finally{
      button.disabled=false;
      button.innerHTML=original;
    }
  });

  if('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    const elements=document.querySelectorAll('.section-heading,.problem,.service-item,.engineering-grid,.portfolio-card,.about-copy,.faq-list');
    elements.forEach(e=>e.classList.add('reveal'));
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target);}}),{threshold:.06,rootMargin:'0px 0px -30px 0px'});elements.forEach(e=>observer.observe(e));
  }
})();
