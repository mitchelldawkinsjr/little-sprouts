// Forked from SimonDev's Quick_MinecraftClone2 (MIT). Changes for Little Sprouts: the worker path is
// relative to this file, and a browser without module workers builds chunks on the page instead.
import {voxel_block_builder} from './voxel-block-builder.js?v=blocks4';

export const worker_pool = (() => {

  let _IDS = 0;
  let _INLINE = null;

  function buildInline(msg) {
    if (!_INLINE) _INLINE = new voxel_block_builder.VoxelBlockBuilder();
    _INLINE.Init(msg.params);
    return {subject: 'build_chunk_result', data: _INLINE.Rebuild()};
  }

  class WorkerThread {
    constructor() {
      this.resolve_ = null;
      this.pending_ = null;
      this.broken_ = false;
      this.id_ = _IDS++;
      try {
        this.worker_ = new Worker(new URL('./voxel-builder-threaded-worker.js?v=blocks4', import.meta.url), {type: 'module'});
        this.worker_.onmessage = (e) => {
          this._OnMessage(e);
        };
        this.worker_.onerror = (e) => {
          e.preventDefault?.();
          this.Break_();
        };
      } catch (e) {
        this.broken_ = true;
      }
    }

    Break_() {
      if (this.broken_) return;
      this.broken_ = true;
      try { this.worker_?.terminate(); } catch (e) { /* already gone */ }
      if (this.pending_) {
        const msg = this.pending_;
        this.pending_ = null;
        this.postMessage(msg, this.resolve_);
      }
    }

    _OnMessage(e) {
      const resolve = this.resolve_;
      this.resolve_ = null;
      this.pending_ = null;
      resolve(e.data);
    }

    get id() {
      return this.id_;
    }

    postMessage(s, resolve) {
      this.resolve_ = resolve;
      if (this.broken_) {
        setTimeout(() => {
          this.resolve_ = null;
          resolve(buildInline(s));
        }, 0);
        return;
      }
      this.pending_ = s;
      this.worker_.postMessage(s);
    }
  }

  class WorkerPool {
    constructor(sz) {
      this.workers_ = [...Array(sz)].map(_ => new WorkerThread());
      this.free_ = [...this.workers_];
      this.busy_ = {};
      this.queue_ = [];
    }

    get length() {
      return this.workers_.length;
    }

    get Busy() {
      return this.queue_.length > 0 || Object.keys(this.busy_).length > 0;
    }

    Enqueue(workItem, resolve) {
      this.queue_.push([workItem, resolve]);
      this.PumpQueue_();
    }

    PumpQueue_() {
      while (this.free_.length > 0 && this.queue_.length > 0) {
        const w = this.free_.pop();
        this.busy_[w.id] = w;

        const [workItem, workResolve] = this.queue_.shift();

        w.postMessage(workItem, (v) => {
          delete this.busy_[w.id];
          this.free_.push(w);
          workResolve(v);
          this.PumpQueue_();
        });
      }
    }
  }

  return {
      WorkerPool: WorkerPool,
  };
})();