// ARDI interactive prototype — no external datasets connected.
const pages = ['dashboard','farm','earth','data','rotation','insights','settings','account'];
const pageNames = {dashboard:'Overview',farm:'My Farm',earth:'Earth Explorer',data:'Farm Data',rotation:'Crop Rotation',insights:'Insights',settings:'Settings',account:'Account'};
function showPage(name){
  if(!pages.includes(name)) return;
  document.querySelectorAll('.page').forEach(p=>p.classList.toggle('active',p.id===`page-${name}`));
  document.querySelectorAll('.nav-link[data-page]').forEach(b=>b.classList.toggle('active',b.dataset.page===name));
  document.getElementById('crumb').textContent=pageNames[name];
  document.getElementById('sidebar').classList.remove('open');
  window.scrollTo({top:0,behavior:'smooth'});
  if(name==='earth') setTimeout(()=>resizeEarth(explorerRenderer,explorerCamera,document.getElementById('explorerCanvas')),80);
}
document.querySelectorAll('[data-page]').forEach(el=>el.addEventListener('click',e=>{e.preventDefault();showPage(el.dataset.page)}));
document.querySelectorAll('[data-go]').forEach(el=>el.addEventListener('click',()=>showPage(el.dataset.go)));
document.getElementById('menuBtn').addEventListener('click',()=>document.getElementById('sidebar').classList.toggle('open'));
document.addEventListener('mousemove',e=>{const g=document.getElementById('cursorGlow');g.style.left=e.clientX+'px';g.style.top=e.clientY+'px'});

// Farm profile: local-only prototype storage, no server or dataset.
const farmFields=['farmName','farmRegion','farmLat','farmLon','farmArea','farmUnit','farmCrop'];
try{
 const saved=JSON.parse(localStorage.getItem('ardiPrototypeFarm')||'null');
 if(saved){farmFields.forEach(id=>{if(saved[id]!==undefined)document.getElementById(id).value=saved[id]});updateFarmVisual(saved)}
}catch(e){}
function updateFarmVisual(data){
 document.getElementById('farmVisualName').textContent=data.farmName||'Your farm starts here';
 document.getElementById('farmVisualRegion').textContent=data.farmRegion||'Add a location to personalize your workspace';
}
document.getElementById('farmForm').addEventListener('submit',e=>{
 e.preventDefault();const data={};farmFields.forEach(id=>data[id]=document.getElementById(id).value);
 try{localStorage.setItem('ardiPrototypeFarm',JSON.stringify(data))}catch(e){}
 updateFarmVisual(data);const btn=e.currentTarget.querySelector('button[type="submit"]');const old=btn.innerHTML;btn.innerHTML='Saved ✓';setTimeout(()=>btn.innerHTML=old,1800);
});

// Season planner fields are interactive and saved locally only.
document.querySelectorAll('.season-card input').forEach((input,i)=>{
 const key='ardiSeason'+i;input.value=localStorage.getItem(key)||'';
 input.addEventListener('input',()=>localStorage.setItem(key,input.value));
});

// Three.js scenes are decorative/illustrative only; no satellite imagery or live data.
let earthRenderer, earthCamera, explorerRenderer, explorerCamera, explorerControls;
function createEarth(canvas,large=false){
 if(!window.THREE||!canvas)return null;
 const scene=new THREE.Scene();
 const camera=new THREE.PerspectiveCamera(38,1,.1,100);
 camera.position.z=large?4.1:4.4;
 const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true});
 renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
 const group=new THREE.Group();scene.add(group);
 const geo=new THREE.SphereGeometry(1.25,72,72);
 const mat=new THREE.MeshPhongMaterial({color:0x245c3c,shininess:22,specular:0x356b50});
 const globe=new THREE.Mesh(geo,mat);group.add(globe);
 // Stylized raised land patches; artistic decoration, not geographic data.
 const landMat=new THREE.MeshStandardMaterial({color:0x9bc77b,roughness:.88});
 const shapes=[
  [0.2,0.42,0.12,0.25,0.16],[0.55,0.08,0.11,0.18,0.12],[-0.42,0.35,0.12,0.22,0.16],
  [-0.58,-0.25,0.10,0.18,0.12],[0.12,-0.48,0.12,0.22,0.16],[0.72,-0.42,0.08,0.14,0.11]
 ];
 shapes.forEach(([lon,lat,sx,sy,sz])=>{
  const patch=new THREE.Mesh(new THREE.IcosahedronGeometry(1,2),landMat);
  patch.scale.set(sx,sy,sz);
  const phi=(Math.PI/2)-lat,theta=lon*Math.PI;
  const r=1.255;
  patch.position.set(r*Math.sin(phi)*Math.cos(theta),r*Math.cos(phi),r*Math.sin(phi)*Math.sin(theta));
  patch.lookAt(0,0,0);group.add(patch);
 });
 const cloud=new THREE.Mesh(new THREE.SphereGeometry(1.29,48,48),new THREE.MeshBasicMaterial({color:0xa5d9b2,transparent:true,opacity:.045,wireframe:true}));
 group.add(cloud);
 const ambient=new THREE.AmbientLight(0x9cc9a2,1.5);scene.add(ambient);
 const key=new THREE.DirectionalLight(0xd5f3c5,2.1);key.position.set(3,2,4);scene.add(key);
 const rim=new THREE.PointLight(0x5fbd84,2,10);rim.position.set(-3,-1,-2);scene.add(rim);
 const stars=new THREE.BufferGeometry(),positions=[];
 for(let i=0;i<550;i++){const r=4+Math.random()*8,a=Math.random()*Math.PI*2,b=Math.acos(2*Math.random()-1);positions.push(r*Math.sin(b)*Math.cos(a),r*Math.sin(b)*Math.sin(a),r*Math.cos(b))}
 stars.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 scene.add(new THREE.Points(stars,new THREE.PointsMaterial({color:0xb8e7ae,size:.018,transparent:true,opacity:.65})));
 let dragging=false,prevX=0,prevY=0,rotX=0,rotY=0;
 if(large){
  canvas.addEventListener('pointerdown',e=>{dragging=true;prevX=e.clientX;prevY=e.clientY;canvas.setPointerCapture(e.pointerId)});
  canvas.addEventListener('pointermove',e=>{if(!dragging)return;rotY+=(e.clientX-prevX)*.006;rotX+=(e.clientY-prevY)*.006;prevX=e.clientX;prevY=e.clientY});
  canvas.addEventListener('pointerup',()=>dragging=false);
  canvas.addEventListener('wheel',e=>{camera.position.z=Math.max(3.1,Math.min(6,camera.position.z+e.deltaY*.003))},{passive:true});
 }
 function resize(){const w=canvas.clientWidth||500,h=canvas.clientHeight||350;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}
 resize();
 function animate(){requestAnimationFrame(animate);if(!dragging){group.rotation.y+=large?0.0014:0.0022;group.rotation.x+=(rotX-group.rotation.x)*.04;group.rotation.y+=(rotY-group.rotation.y)*.04}cloud.rotation.y-=.0005;renderer.render(scene,camera)}
 animate();
 return {renderer,camera,resize};
}
function resizeEarth(renderer,camera,canvas){if(!renderer||!canvas)return;const w=canvas.clientWidth||500,h=canvas.clientHeight||350;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}
function initScenes(){
 const small=createEarth(document.getElementById('earthCanvas'),false);if(small){earthRenderer=small.renderer;earthCamera=small.camera}
 const big=createEarth(document.getElementById('explorerCanvas'),true);if(big){explorerRenderer=big.renderer;explorerCamera=big.camera}
}
window.addEventListener('resize',()=>{resizeEarth(earthRenderer,earthCamera,document.getElementById('earthCanvas'));resizeEarth(explorerRenderer,explorerCamera,document.getElementById('explorerCanvas'))});
initScenes();


// Account sign-in interface (visual prototype; no authentication service connected).
document.getElementById('accountBtn').addEventListener('click',()=>showPage('account'));
document.getElementById('backWorkspace').addEventListener('click',()=>showPage('dashboard'));
document.getElementById('togglePassword').addEventListener('click',()=>{
 const input=document.getElementById('loginPassword');
 const reveal=input.type==='password';
 input.type=reveal?'text':'password';
 document.getElementById('togglePassword').textContent=reveal?'HIDE':'SHOW';
 document.getElementById('togglePassword').setAttribute('aria-label',reveal?'Hide password':'Show password');
});
document.getElementById('loginForm').addEventListener('submit',e=>{
 e.preventDefault();
 document.getElementById('loginFeedback').textContent='The login interface is ready, but authentication has not been connected to a backend yet.';
});
document.getElementById('forgotPassword').addEventListener('click',e=>{
 e.preventDefault();
 document.getElementById('loginFeedback').textContent='Password recovery will be available once an authentication service is connected.';
});
document.getElementById('createAccountBtn').addEventListener('click',()=>{
 document.getElementById('loginView').hidden=true;
 document.getElementById('signupView').hidden=false;
 document.getElementById('signupName').focus();
});
document.getElementById('backToLogin').addEventListener('click',()=>{
 document.getElementById('signupView').hidden=true;
 document.getElementById('loginView').hidden=false;
 document.getElementById('loginEmail').focus();
});
function attachPasswordToggle(buttonId,inputId){
 const button=document.getElementById(buttonId),input=document.getElementById(inputId);
 button.addEventListener('click',()=>{
  const reveal=input.type==='password';input.type=reveal?'text':'password';
  button.textContent=reveal?'HIDE':'SHOW';
  button.setAttribute('aria-label',reveal?'Hide password':'Show password');
 });
}
attachPasswordToggle('toggleSignupPassword','signupPassword');
attachPasswordToggle('toggleConfirmPassword','signupConfirm');

// Client-side password guidance only. The backend must repeat all checks,
// use a real compromised-password blocklist, and enforce policy on registration.
const demoBlockedPasswords=new Set(['passwordpassword','123456789012345','qwertyuiopasdfgh','letmeinletmein1','ardipassword123']);
function updateSignupPasswordGuidance(){
 const password=document.getElementById('signupPassword').value;
 const length=Array.from(password).length;
 const lengthOK=length>=15&&length<=128;
 const commonOK=!demoBlockedPasswords.has(password.toLowerCase());
 const setRule=(id,passed)=>{
  const el=document.getElementById(id);el.classList.toggle('passed',passed);
  el.querySelector('i').textContent=passed?'✓':'○';
 };
 setRule('ruleLength',lengthOK);setRule('ruleCommon',commonOK);
 const score=(lengthOK?65:Math.min(55,length/15*55))+(commonOK?35:0);
 const fill=document.getElementById('passwordMeterFill');fill.style.width=Math.min(100,score)+'%';
 fill.style.background=lengthOK&&commonOK?'#9ed69a':'#c69b5b';
}
document.getElementById('signupPassword').addEventListener('input',updateSignupPasswordGuidance);
document.getElementById('signupForm').addEventListener('submit',e=>{
 e.preventDefault();
 const name=document.getElementById('signupName').value.trim();
 const email=document.getElementById('signupEmail').value.trim();
 const password=document.getElementById('signupPassword').value;
 const confirm=document.getElementById('signupConfirm').value;
 const feedback=document.getElementById('signupFeedback');
 const length=Array.from(password).length;
 if(!name||!email){feedback.textContent='Please complete your name and email address.';return;}
 if(length<15||length>128){feedback.textContent='Your password must be between 15 and 128 characters.';return;}
 if(demoBlockedPasswords.has(password.toLowerCase())){feedback.textContent='Choose a less common password.';return;}
 if(password!==confirm){feedback.textContent='The passwords do not match.';return;}
 feedback.textContent='The frontend checks passed. Account creation is not available until the backend is connected.';
});
