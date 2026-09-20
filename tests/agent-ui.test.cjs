const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const {renderToStaticMarkup} = require('react-dom/server');
const {MemoryRouter} = require('react-router-dom');
const root = path.resolve(__dirname, '../src');
const cache = new Map();
const stub = {__esModule:true,default:({children})=>React.createElement(React.Fragment,null,children)};
const loadable = ['pages/welcomepage.tsx','pages/SignIn.tsx','pages/Register.tsx','pages/AgentPreview.tsx','pages/agentPreviewState.ts','components/RegistrationTabs.tsx','components/AgentAccountSwitcher.tsx','components/AgentAccountControls.tsx','components/PersonalFormFields.tsx'];
function load(name) {
 const file=path.resolve(root,name);
 if(cache.has(file)) return cache.get(file);
 const exports={};cache.set(file,exports);
 const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
 const requireModule = spec => {
  if(!spec.startsWith('.')) return require(spec);
  if(/\.(css|scss)$/.test(spec)) return {};
  if(/\.(png|mp4)$/.test(spec)) return {__esModule:true,default:'asset'};
  const absolute=path.resolve(path.dirname(file),spec);
  const target=loadable.find(entry => path.resolve(root,entry).replace(/\.tsx?$/,'') === absolute);
  if(target) return load(target);
  if(spec.includes('ThemeContext')) return {useTheme:()=>({theme:'light',appearance:'system',setAppearance:()=>{},toggleTheme:()=>{}})};
  if(spec.includes('api/auth')) return new Proxy({}, {get:()=>()=>{throw new Error('Unexpected auth request in preview render');}});
  if(spec.includes('userUtils')) return {getUserAccountType:()=> 'personal',isAuthenticated:()=>false};
  if(spec.includes('businessCategories')) return {BUSINESS_CATEGORIES:[]};
  if(spec.includes('validationSchemas')) return {validatePersonalForm:()=>[],validateBusinessForm:()=>[]};
  return stub;
 };
 vm.runInNewContext(code,{exports,require:requireModule,console,URLSearchParams,setTimeout,clearTimeout});
 return exports;
}
function render(file,url){const Component=load(file).default;return renderToStaticMarkup(React.createElement(MemoryRouter,{initialEntries:[url]},React.createElement(Component)));}
test('Welcome visibly offers Agent registration',()=>{assert.match(render('pages/welcomepage.tsx','/welcome'),/Register as an agent/);});
test('Agent login is discoverable and explicitly a preview',()=>{const html=render('pages/SignIn.tsx','/signin?type=agent');assert.match(html,/PREVIEW AGENT DASHBOARD/);assert.match(html,/credentials will not be submitted/);});
test('Agent signup reuses personal fields and adds both services, bio and categories',()=>{const html=render('pages/Register.tsx','/agent-form');for(const label of ['First Name','Last Name','Help me buy','Help me deliver','Agent bio','Categories / specialties','PREVIEW AGENT ACCOUNT'])assert.ok(html.includes(label),label);});
test('Dashboard includes requests, jobs, weekly earnings and agent feed navigation',()=>{const html=render('pages/AgentPreview.tsx','/agents');for(const label of ['Requests','Jobs','This week','Job earnings','/agents/feed','1,050,000'])assert.ok(html.includes(label),label);});
test('Agent profile exposes photo and edit controls with its unique badge',()=>{const html=render('pages/AgentPreview.tsx','/agents/profile');assert.match(html,/Change profile picture/);assert.match(html,/Edit profile/);assert.match(html,/#8B5CF6/i);assert.match(html,/Switch account/);});
test('Agent inbox is isolated and customer request entry keeps navigation',()=>{assert.match(render('pages/AgentPreview.tsx','/agents/notifications'),/separate from Personal and Business/);const html=render('pages/AgentPreview.tsx','/agent-services/request?service=deliver');assert.match(html,/Help me deliver/);assert.match(html,/Reference images \(0\/3\)/);assert.match(html,/Account navigation/);});

test('Agent settings has account, availability and isolated notification preferences',()=>{const html=render('pages/AgentPreview.tsx','/agents/settings');for(const label of ['Agent settings','Account details','Edit profile','Switch account','Accepting requests','New requests','Job updates','Messages','Appearance','Device theme','Light mode','Dark mode','Digital membership ID','Referrals','Help &amp; Support','Legal'])assert.ok(html.includes(label),label);assert.match(html,/agent-web-navigation/);assert.doesNotMatch(html,/class="agent-bottom"/);});

test('Agent account controls expose privacy, safety and account lifecycle sections',()=>{const html=render('pages/AgentPreview.tsx','/agents/settings');for(const label of ['Verification &amp; security','Notification settings','Download my data','Report a safety concern','Blocked accounts','Contact support','Deactivate account','Delete account','Device permissions'])assert.ok(html.includes(label),label);});
