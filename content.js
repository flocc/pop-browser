(() => {

// if (window !== window.top) return;

const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = chrome.runtime.getURL('style.css');
document.head.appendChild(link);

const BLOCK_ID = 'polish_our_prices';

const tooltip = document.createElement('div');
tooltip.className = 'pop-global-tooltip';
document.body.appendChild(tooltip);

let showTimer = null;
let hideTimer = null;

function attachTooltips() {
  document.querySelectorAll('.pop .tooltip').forEach(el => {
    if (el.dataset.popAttached) return;
    el.dataset.popAttached = '1';

    const textEl = el.querySelector('.tooltip-text');
    const valueEl = el.querySelector('.tooltip-value');
    if (!textEl || !valueEl) return;

    valueEl.dataset.tip = textEl.textContent.trim();
    textEl.remove();

    valueEl.addEventListener('mouseenter', () => {
      clearTimeout(hideTimer);
      showTimer = setTimeout(() => {
        tooltip.textContent = valueEl.dataset.tip;
        const r = valueEl.getBoundingClientRect();
        tooltip.style.left = r.left + r.width / 2 + 'px';
        tooltip.style.top = r.top - 8 + 'px';
        tooltip.style.transform = 'translate(-50%, -100%)';
        tooltip.style.opacity = '1';
      }, 350);
    });

    valueEl.addEventListener('mouseleave', () => {
      clearTimeout(showTimer);
      hideTimer = setTimeout(() => { tooltip.style.opacity = '0'; }, 50);
    });
  });
}

function getAppId() {
  const match = location.pathname.match(/\/app\/(\d+)/);
  return match ? match[1] : null;
}

function fmt(num) {
  return num.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtSigned(num) {
  const abs = Math.abs(num).toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (num >= 0 ? '+' : '-') + abs;
}

function val(id) {
  return document.querySelector(`#${id} .tooltip-value`);
}

function setPercentChange(id, value) {
  if (value === 0) return;
  const el = document.getElementById(id);
  el.classList.add(value > 0 ? 'increase' : 'decrease');
  val(id).innerHTML = '<sup>' + fmtSigned(value) + '%</sup>';
}

function inject() {
  if (document.getElementById(BLOCK_ID)) return true;

  const anchor = document.querySelector('.block.responsive_apppage_details_right.heading');
  if (!anchor) return false;

  const plFlag = chrome.runtime.getURL('icons/pl.svg');
  const euFlag = chrome.runtime.getURL('icons/eu.svg');

  const block = document.createElement('div');
  block.className = 'block pop';
  block.id = BLOCK_ID;
  block.innerHTML = `
    <div class="block_content_inner">
      <div class="pop_grid" dir="ltr">

        <span class="pop_name"><img src="${plFlag}" alt="PL"></span>
        <span class="tooltip pop_pln" id="pop_pln">
          <span class="tooltip-value"></span>
          <span class="tooltip-text">Cena w Polsce</span>
        </span>
        <span class="tooltip pop_valve_percent_change_pln" id="pop_valve_percent_change_pln">
          <span class="tooltip-value"></span>
          <span class="tooltip-text">Różnica od ceny sugerowanej (%)</span>
        </span>
        <span class="tooltip pop_valve_pln" id="pop_valve_pln">
          <span class="tooltip-value"></span>
          <span class="tooltip-text">Cena sugerowana w Polsce</span>
        </span>

        <span class="pop_name"><img src="${euFlag}" alt="EU"></span>
        <span class="tooltip pop_eur_to_pln" id="pop_eur_to_pln">
          <span class="tooltip-value"></span>
          <span class="tooltip-text">Euro w PLN</span>
        </span>
        <span class="tooltip pop_arrow" id="pop_arrow">
          <span class="tooltip-value">🡄</span>
          <span class="tooltip-text"></span>
        </span>
        <span class="tooltip pop_eur" id="pop_eur">
          <span class="tooltip-value"></span>
          <span class="tooltip-text">Cena w Euro</span>
        </span>
        <span class="tooltip pop_valve_percent_change_eur" id="pop_valve_percent_change_eur">
          <span class="tooltip-value"></span>
          <span class="tooltip-text">Różnica od ceny sugerowanej (%)</span>
        </span>
        <span class="tooltip pop_valve_eur" id="pop_valve_eur">
          <span class="tooltip-value"></span>
          <span class="tooltip-text">Cena sugerowana w Euro</span>
        </span>

        <hr class="pop_separator" />

        <span class="tooltip pop_diff_pln_from_eur" id="pop_diff_pln_from_eur">
          <span class="tooltip-value"></span>
          <span class="tooltip-text">Różnica cen</span>
        </span>
        <span class="tooltip pop_percent_change_pln_from_eur" id="pop_percent_change_pln_from_eur">
          <span class="tooltip-value"></span>
          <span class="tooltip-text">Różnica cen (%)</span>
        </span>

        <hr class="pop_separator" />

        <span class="pop_description" id="pop_description">–</span>
      </div>
    </div>
  `;

  anchor.parentNode.insertBefore(block, anchor);
  return true;
}

function render(d) {
  val('pop_pln').textContent = fmt(d.price_pln) + ' zł';
  val('pop_valve_pln').textContent = fmt(d.valve_price_pln) + ' zł';
  val('pop_eur_to_pln').textContent = fmt(d.price_eur_to_pln) + ' zł';
  val('pop_eur').textContent = fmt(d.price_eur) + ' €';
  val('pop_valve_eur').textContent = fmt(d.valve_price_eur) + ' €';
  document.querySelector('.pop_arrow .tooltip-text').textContent = 'EUR/PLN = ' + fmt(d.eur_to_pln);

  setPercentChange('pop_valve_percent_change_pln', d.valve_price_percent_change_pln);
  setPercentChange('pop_valve_percent_change_eur', d.valve_price_percent_change_eur);

  const positive = d.pop > 0;
  document.getElementById('pop_diff_pln_from_eur').classList.add(positive ? 'positive' : 'negative');
  document.getElementById('pop_percent_change_pln_from_eur').classList.add(positive ? 'positive' : 'negative');
  val('pop_diff_pln_from_eur').textContent = fmtSigned(d.price_diff_pln_from_eur) + ' zł';
  val('pop_percent_change_pln_from_eur').textContent = '( ' + fmtSigned(d.price_percent_change_pln_from_eur) + '% )';

  document.getElementById('pop_description').innerHTML =
    d.description + (d.is_polish_developer ? '<br />Polski developer' : '');

  attachTooltips();
}

function fetchAndRender() {
  const appId = getAppId();
  if (!appId) return;

  chrome.runtime.sendMessage({ type: 'POP_FETCH_INFO', appId }, response => {
    if (chrome.runtime.lastError || !response?.ok) return;
    render(response.data);
  });
}

function init() {
  document.getElementById(BLOCK_ID)?.remove();

  if (inject()) {
    fetchAndRender();
    return;
  }

  const observer = new MutationObserver(() => {
    if (inject()) {
      observer.disconnect();
      fetchAndRender();
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
  setTimeout(() => observer.disconnect(), 10000);
}

init();

let lastUrl = location.href;
new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    init();
  }
}).observe(document.body, { childList: true, subtree: true });

})();
