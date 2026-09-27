export class DNTUMascot {
  constructor(element, basePath = './mascot/animated') { this.el = element; this.basePath = basePath; this.state = 'idle'; }
  setState(state, alt = '') { this.state = state; this.el.src = `${this.basePath}/${state}.webp`; this.el.alt = alt || `Cú DNTU: ${state}`; }
  reset(delay = 1600) { window.setTimeout(() => this.setState('idle'), delay); }
}
