'use strict';

// Exercise the shared drawer without a server or changes to real browser data.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { JSDOM } = require('jsdom');

for (const role of ['admin', 'principal', 'supervisor', 'teacher', 'student', 'parent']) {
  const html = fs.readFileSync(`awn/${role}-dashboard.html`, 'utf8');
  const dom = new JSDOM(html, { url: `http://localhost/${role}-dashboard.html`, runScripts: 'outside-only' });
  const { window } = dom;
  const doc = window.document;
  let breakpointChanged;
  const media = { matches: true, addEventListener: (_, handler) => { breakpointChanged = handler; } };
  window.matchMedia = () => media;
  window.requestAnimationFrame = (handler) => handler();
  window.localStorage.setItem('awn_session', JSON.stringify({ username: role, role, name: 'حساب الاختبار' }));
  window.AWN_CONFIG = { demoMode: true };
  window.eval(fs.readFileSync('awn/js/config/roles.js', 'utf8'));
  window.eval(fs.readFileSync('awn/js/utils/shared.js', 'utf8'));
  window.AwnSession = { current:() => JSON.parse(window.localStorage.getItem('awn_session')), ready:Promise.resolve() };
  window.AwnUI = { notify() {} };
  window.eval(fs.readFileSync('awn/js/components/brand.js', 'utf8'));
  window.eval(fs.readFileSync('awn/js/components/app-shell.js', 'utf8'));
  window.AwnShell.mount();
  window.eval(fs.readFileSync('awn/js/components/sidebar.js', 'utf8'));

  const sidebar = doc.querySelector('aside.awn-sidebar');
  const trigger = doc.querySelector('[data-awn-sidebar-toggle], [data-sidebar-toggle]');
  assert(sidebar && trigger, `${role}: sidebar and trigger exist`);
  assert.equal(sidebar.querySelectorAll('.brand-symbol').length, 1, `${role}: shared vector logo`);
  assert.equal(sidebar.querySelectorAll('img').length, 0, `${role}: old logos removed`);
  assert(!/وزارة|المنظومة الوطنية/.test(sidebar.textContent), `${role}: school identity`);
  assert(sidebar.inert, `${role}: closed drawer is outside the tab order`);
  assert.equal(sidebar.querySelectorAll('[aria-current="page"]').length, 1, `${role}: one current page`);
  trigger.focus();
  trigger.click();
  assert.equal(sidebar.getAttribute('aria-modal'), 'true', `${role}: open drawer is modal`);
  assert.equal(trigger.getAttribute('aria-expanded'), 'true', `${role}: trigger state announced`);
  assert.equal(doc.activeElement, sidebar.querySelector('[data-awn-sidebar-close]'), `${role}: focus moves inside`);
  const workspace = role === 'admin' ? doc.querySelector('.admin-workspace') : doc.querySelector('main').closest('body > div');
  assert(workspace.inert, `${role}: content behind drawer cannot receive focus`);
  doc.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert.equal(doc.activeElement, trigger, `${role}: Escape restores trigger focus`);
  assert(sidebar.inert && !workspace.inert, `${role}: background restored after close`);

  trigger.click();
  sidebar.querySelector('[data-awn-sidebar-close]').click();
  assert.equal(trigger.getAttribute('aria-expanded'), 'false', `${role}: close button works`);
  trigger.click();
  const backdrop = doc.querySelector('#sidebar-overlay, .admin-backdrop');
  backdrop.click();
  assert(sidebar.inert, `${role}: backdrop dismisses drawer`);

  trigger.click();
  media.matches = false;
  breakpointChanged();
  assert(!sidebar.inert && !workspace.inert, `${role}: desktop restores navigation and content`);
  assert.equal(sidebar.getAttribute('aria-modal'), null, `${role}: desktop is not modal`);
  assert.equal(doc.body.style.overflow, '', `${role}: resizing restores page scrolling`);

  if (role !== 'admin') {
    window.currentUser = () => ({ name: 'حساب الاختبار', username: role, role });
    window.eval(fs.readFileSync('awn/js/components/navigation.js', 'utf8'));
    const link = [...sidebar.querySelectorAll('[data-path]')].find((item) => item.dataset.path !== 'view-dashboard' && doc.getElementById(item.dataset.path));
    window.navigateTo(link.dataset.path);
    assert.equal(link.getAttribute('aria-current'), 'page', `${role}: navigation updates announced current page`);
    assert.equal(sidebar.querySelectorAll('[aria-current="page"]').length, 1, `${role}: stale active page cleared`);
    assert(!doc.getElementById(link.dataset.path).classList.contains('hidden'), `${role}: selected view is shown`);
  }
  console.log(`PASS ${role}: branding, drawer, focus, dismissal, responsive state${role === 'admin' ? '' : ', navigation'}`);
  dom.window.close();
}
