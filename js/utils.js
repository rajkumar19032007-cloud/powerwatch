/**
 * CampusOS — Utility Functions (utils.js)
 * Reusable helper functions for UI interactions and DOM manipulation
 */

/**
 * Safe query selector helper
 * @param {string} selector - CSS selector string
 * @param {Element} [scope=document] - Parent element scope
 * @returns {Element|null} Selected element or null
 */
function qs(selector, scope = document) {
  return scope.querySelector(selector);
}

/**
 * Safe query selector all helper
 * @param {string} selector - CSS selector string
 * @param {Element} [scope=document] - Parent element scope
 * @returns {NodeList} NodeList of matched elements
 */
function qsa(selector, scope = document) {
  return scope.querySelectorAll(selector);
}

/**
 * Smoothly scrolls to a target element or selector
 * @param {string|Element} target - CSS selector or DOM Element
 * @param {number} [offset=72] - Top offset for fixed header
 */
function scrollToElement(target, offset = 72) {
  const element = typeof target === 'string' ? qs(target) : target;
  if (!element) return;

  const elementPosition = element.getBoundingClientRect().top;
  const offsetPosition = elementPosition + window.pageYOffset - offset;

  window.scrollTo({
    top: offsetPosition,
    behavior: 'smooth'
  });
}
