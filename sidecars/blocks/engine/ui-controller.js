import {entity} from './entity.js?v=blocks3';
import {texture_defs} from './texture-defs.js?v=blocks3';
import {textures} from './textures.js?v=blocks3';

// Forked from SimonDev's Quick_MinecraftClone2 (MIT). The original drew a fixed icon bar from PNGs
// and cycled it with [ and ]. Here the bar shows only blocks this player has unlocked, each button
// is big enough to tap, and the controller shoulders cycle it. The first button is a shovel, so
// digging sits right next to the blocks: slot 0 digs, slots 1.. build with a block.
export const ui_controller = (() => {

  class UIController extends entity.Component {
    static CLASS_NAME = 'UIController';

    get NAME() {
      return UIController.CLASS_NAME;
    }

    constructor(params) {
      super();
      this.params_ = params;
      this.unlocked_ = [...params.unlocked];
      this.iconIndex_ = 1;
      this.blockIndex_ = 0;
      this.onMode = params.onMode || (() => {});
      this.swatches_ = {};
    }

    InitEntity() {
      this.iconBar_ = this.params_.bar;
      this.Paint_();
      this.Select(1 + Math.max(0, this.unlocked_.indexOf(this.params_.selected)));
    }

    Swatch_(type) {
      if (!this.swatches_[type]) {
        const def = texture_defs.DEFS[type];
        this.swatches_[type] = textures.swatch(def.icon || def.texture[2]);
      }
      return this.swatches_[type];
    }

    Paint_() {
      this.iconBar_.textContent = '';
      const shovel = document.createElement('button');
      shovel.type = 'button';
      shovel.className = 'icon-bar-item dig-slot';
      shovel.textContent = '⛏';
      shovel.setAttribute('aria-label', 'Dig');
      shovel.title = 'Dig';
      shovel.addEventListener('click', () => this.Select(0));
      this.iconBar_.appendChild(shovel);
      this.icons_ = [shovel, ...this.unlocked_.map((type, i) => {
        const index = i + 1;
        const e = document.createElement('button');
        e.type = 'button';
        e.className = 'icon-bar-item';
        e.style.backgroundImage = `url('${this.Swatch_(type)}')`;
        e.setAttribute('aria-label', `${texture_defs.DEFS[type].label} block`);
        e.title = texture_defs.DEFS[type].label;
        e.dataset.type = type;
        e.addEventListener('click', () => this.Select(index));
        this.iconBar_.appendChild(e);
        return e;
      })];
    }

    get Unlocked() {
      return [...this.unlocked_];
    }

    // The block to build with, even while the shovel is out.
    get Selected() {
      return this.unlocked_[this.blockIndex_];
    }

    Unlock(type) {
      if (this.unlocked_.includes(type) || !texture_defs.DEFS[type]) return false;
      this.unlocked_.push(type);
      this.Paint_();
      this.Select(this.unlocked_.length);
      this.icons_[this.iconIndex_].classList.add('new');
      return true;
    }

    Select(index) {
      if (!this.icons_.length) return;
      this.iconIndex_ = (index + this.icons_.length) % this.icons_.length;
      if (this.iconIndex_ === 0) {
        this.Highlight_();
        this.onMode('dig');
        return;
      }
      this.blockIndex_ = this.iconIndex_ - 1;
      this.Highlight_();
      const player = this.FindEntity('player');
      player.GetComponent('VoxelTools').SetVoxelType(this.Selected);
      player.Broadcast({topic: 'ui.blockChanged', value: this.Selected});
      this.onMode('build');
    }

    // The Build/Dig button changed the mode: move the highlight to match, nothing else.
    ShowMode(mode) {
      const index = mode === 'dig' ? 0 : this.blockIndex_ + 1;
      if (index === this.iconIndex_) return;
      this.iconIndex_ = index;
      this.Highlight_();
    }

    Highlight_() {
      this.icons_.forEach((icon, i) => {
        icon.classList.toggle('highlight', i === this.iconIndex_);
        icon.setAttribute('aria-pressed', i === this.iconIndex_ ? 'true' : 'false');
      });
      try { this.icons_[this.iconIndex_].scrollIntoView({block: 'nearest', inline: 'nearest'}); } catch (e) { /* old browsers */ }
    }

    CycleBuildIcon_(dir) {
      this.Select(this.iconIndex_ + dir);
    }
  };

  return {
      UIController: UIController,
  };
})();
