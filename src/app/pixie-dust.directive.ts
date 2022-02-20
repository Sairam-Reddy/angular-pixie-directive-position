import {
  Directive,
  OnChanges,
  AfterViewInit,
  ElementRef,
  Input,
} from '@angular/core';
import { Particle } from './models/particle.model';
import { Vector } from './models/vector.model';

@Directive({
  selector: '[appPixieDust]',
})
export class PixieDustDirective implements OnChanges, AfterViewInit {
  // input to the directive
  // on change of the value, burst mode is activated
  @Input() value;

  public MAX_LIFE: number = 50;
  public canvas: HTMLCanvasElement;
  public inputElement: HTMLElement;
  public field: DOMRect;
  public caret: HTMLSpanElement;

  private particles: Array<Particle> = [];
  private destroyed: Array<Particle> = [];

  private context: CanvasRenderingContext2D;
  private behavior: any;
  private paint: any;
  private update: any;
  private stage: any = () => {};
  private options: any;

  private resizeObserver;

  public constructor(private element: ElementRef) {}

  public ngOnChanges(): void {
    if (this.options) {
      this.options.action();
    }
  }

  public ngAfterViewInit(): void {
    this.inputElement = this.element.nativeElement;
    this.caret = document.createElement('span');
    this.caret.style.position = 'absolute';
    this.caret.style.left = '0';
    this.caret.style.top = '0';
    this.caret.style.margin = '0';
    this.caret.style.width = 'auto';
    this.caret.style.visibility = 'hidden';
    this.caret.style.border = '2px solid rgba(255, 255, 255, 0.5)';
    this.caret.style.fontSize = '1.75em';
    this.caret.style.padding = '0.25em 0.5em 0.3125em';
    this.caret.style.color = 'rgba(255, 255, 255, 0.5)';
    this.caret.style.borderRadius = '0.25em';
    this.caret.style.background = 'transparent';
    this.caret.style.transition = 'all 0.1s';

    this.element.nativeElement.appendChild(this.caret);

    // Resize
    this.resizeObserver = new ResizeObserver(() => {
      this.reposition();
      // correct canvas size on element resize
      if (this.canvas) {
        this.fitCanvas();
      }
    });
    this.resizeObserver.observe(this.element.nativeElement);

    this.reposition();

    this.options = {
      init: () => {},
      tick: (particles: Array<Particle>) => {
        if (!particles) {
          return;
        }

        particles.forEach((p) => {
          if (p.life > this.MAX_LIFE) {
            this.destroy(p);
          }
        });
      },
      beforePaint: () => {
        this.clear();
      },
      paint: (particle: Particle) => {
        const p = particle.position;
        const s = particle.size;
        const o = 1 - particle.life / this.MAX_LIFE;

        this.paint.circle(p.x, p.y, s, 'rgba(255,255,255,' + o + ')');
        this.paint.circle(
          p.x,
          p.y,
          s + 1.5,
          'rgba(231,244,255,' + o * 0.25 + ')'
        );

        // extra
        const w = 2;
        const wh = w * 0.5;
        const h = 35;
        const hh = h * 0.5;
        this.context.rect(p.x - wh, p.y - hh, w, h);
        this.context.fillStyle = 'rgba(231,244,255,' + o * 0.025 + ')';
        this.context.fill();
        this.context.closePath();
      },
      afterPaint: () => {
        // nothing
      },
      action: () => {
        this.burst(12);

        // can be used for inputs
        this.inputElement.classList.add('keyup');
        setTimeout(() => {
          this.inputElement.classList.remove('keyup');
        }, 100);
      },
    };

    this.startSimulation();
  }

  public reposition() {
    this.field = this.inputElement.getBoundingClientRect();
  }

  private getRandomBetween(min: number, max: number): number {
    return min + Math.random() * (max - min);
  }

  private burst(intensity) {
    let behavior = [
      this.behavior.force(-0.015, -0.015),
      this.behavior.cohesion(50),
      this.behavior.move(),
    ];

    const size = 3.25;
    const force = 0.7;
    const lifeMin = 0;
    const progress =
      Math.min(this.field.width, this.caret.offsetWidth) / this.field.width;
    const offset = this.field.left + this.field.width * progress;
    const rangeMin = Math.max(this.field.left, offset - 30);
    const rangeMax = Math.min(this.field.right, offset + 10);

    const sprayCount: number = Math.ceil(
      this.field.width / Math.min(this.field.width, this.caret.offsetWidth)
    );

    for (let i = 0; i <= sprayCount; i++) {
      const offsetPart = this.field.left + this.field.width * progress * i;
      const offsetrangeMin = Math.max(this.field.left, offsetPart - 30);
      const offsetrangeMax = Math.min(this.field.right, offsetPart + 10);

      this.spray(intensity, () => {
        return [
          null,
          null,
          Vector.create(
            this.getRandomBetween(offsetrangeMin + 10, offsetrangeMax - 20),
            this.getRandomBetween(this.field.top + 15, this.field.bottom - 15)
          ),
          Vector.random(force),
          size + Math.random(),
          this.getRandomBetween(lifeMin, 0),
          behavior,
        ];
      });
    }

    // top edge
    this.spray(intensity * 0.5, () => {
      return [
        null,
        null,
        Vector.create(
          this.getRandomBetween(rangeMin, rangeMax),
          this.field.top
        ),
        Vector.random(force),
        size + Math.random(),
        this.getRandomBetween(lifeMin, 0),
        behavior,
      ];
    });

    // bottom edge
    this.spray(intensity * 0.5, () => {
      return [
        null,
        null,
        Vector.create(
          this.getRandomBetween(rangeMin, rangeMax),
          this.field.top + this.field.height
        ),
        Vector.random(force),
        size + Math.random(),
        this.getRandomBetween(lifeMin, 0),
        behavior,
      ];
    });

    // right edge
    if (rangeMax === this.field.right) {
      this.spray(intensity * 2, () => {
        return [
          null,
          null,
          Vector.create(
            this.field.right,
            this.getRandomBetween(this.field.top, this.field.bottom)
          ),
          Vector.random(force),
          size + Math.random(),
          this.getRandomBetween(lifeMin, 0),
          behavior,
        ];
      });
    }
  }

  private startSimulation() {
    // start particle simulation
    this.simulate('2d', this.options);
  }

  // setup DOM
  private simulate(dimensions, options) {
    if (!this.update) {
      this.update = () => {};
    }

    if (!this.stage) {
      this.stage = () => {};
    }

    if (!options) {
      console.error('"options" object must be defined');
      return;
    }

    if (!options.init) {
      console.error('"init" function must be defined');
      return;
    }

    if (!options.paint) {
      console.error('"paint" function must be defined');
      return;
    }

    if (!options.tick) {
      options.tick = () => {};
    }

    if (!options.beforePaint) {
      options.beforePaint = () => {};
    }

    if (!options.afterPaint) {
      options.afterPaint = () => {};
    }

    if (!options.action) {
      options.action = () => {};
    }

    this.setup(dimensions, options);
  }

  // resizes canvas to fit element dimensions
  private fitCanvas() {
    this.canvas.width = this.element.nativeElement.offsetWidth;
    this.canvas.height = this.element.nativeElement.offsetHeight;
  }

  // create canvas for drawing
  private setup(dimensions, options) {
    // create
    this.canvas = document.createElement('canvas');
    this.canvas.style.position = 'absolute';
    this.canvas.style.left = '0';
    this.canvas.style.right = '0';
    this.canvas.style.top = '0';
    this.canvas.style.bottom = '0';
    this.canvas.style.pointerEvents = 'none';

    this.element.nativeElement.appendChild(this.canvas);

    // go
    this.go(dimensions, options);
  }

  // canvas has been attached, let's go!
  private go(dimensions, options) {
    // set initial canvas size
    this.fitCanvas();

    // get context for drawing
    this.context = this.canvas.getContext(dimensions);

    this.paint = {
      circle: (x, y, size, color) => {
        this.context.beginPath();
        this.context.arc(x, y, size, 0, 2 * Math.PI, false);
        this.context.fillStyle = color;
        this.context.fill();
      },
      square: (x, y, size, color) => {
        this.context.beginPath();
        this.context.rect(x - size * 0.5, y - size * 0.5, size, size);
        this.context.fillStyle = color;
        this.context.fill();
      },
    };

    this.behavior = {
      cohesion: (range = 100, speed = 0.001) => {
        range = Math.pow(range, 2);

        return (particle) => {
          const center = new Vector();
          let i = 0;
          const l = this.particles.length;
          let count = 0;

          if (l <= 1) {
            return;
          }

          for (; i < l; i++) {
            // don't use self in group
            if (
              this.particles[i] === particle ||
              Vector.distanceSquared(
                this.particles[i].position,
                particle.position
              ) > range
            ) {
              continue;
            }

            center.add(
              Vector.subtract(this.particles[i].position, particle.position)
            );
            count++;
          }

          if (count > 0) {
            center.divide(count);

            center.normalize();
            center.multiply(particle.velocity.magnitude);

            center.multiply(0.05);
          }

          particle.velocity.add(center);
        };
      },
      separation: (distance: number = 25) => {
        distance = Math.pow(distance, 2);

        return (particle) => {
          const heading: Vector = new Vector();
          let i = 0;
          const l = this.particles.length;
          let count = 0;
          let diff;

          if (l <= 1) {
            return;
          }

          for (; i < l; i++) {
            // don't use self in group
            if (
              this.particles[i] === particle ||
              Vector.distanceSquared(
                this.particles[i].position,
                particle.position
              ) > distance
            ) {
              continue;
            }

            // stay away from neighbours
            diff = Vector.subtract(
              particle.position,
              this.particles[i].position
            );
            diff.normalize();

            heading.add(diff);
            count++;
          }

          if (count > 0) {
            // get average
            heading.divide(count);

            // make same length as current velocity (so particle won't speed up)
            heading.normalize();
            heading.multiply(particle.velocity.magnitude);

            // limit force to make particle movement smoother
            heading.limit(0.1);
          }

          particle.velocity.add(heading);
        };
      },
      alignment: (range = 100) => {
        range = Math.pow(range, 2);
        return (particle) => {
          var i = 0;
          var l = this.particles.length;
          var count = 0;
          var heading = new Vector();

          if (l <= 1) {
            return;
          }

          for (; i < l; i++) {
            // don't use self in group also don't align when out of range
            if (
              this.particles[i] === particle ||
              Vector.distanceSquared(
                this.particles[i].position,
                particle.position
              ) > range
            ) {
              continue;
            }

            heading.add(this.particles[i].velocity);
            count++;
          }

          if (count > 0) {
            heading.divide(count);
            heading.normalize();
            heading.multiply(particle.velocity.magnitude);

            // limit
            heading.multiply(0.1);
          }

          particle.velocity.add(heading);
        };
      },
      move: () => {
        return (particle) => {
          particle.position.add(particle.velocity);

          // handle collisions?
        };
      },
      eat: (food = []) => {
        return (particle) => {
          let i: number = 0;
          const l: number = this.particles.length;
          let prey: Particle;

          for (; i < l; i++) {
            prey = this.particles[i];

            // can't eat itself, also, needs to be tasty
            if (prey === particle || food.indexOf(prey.group) === -1) {
              continue;
            }

            // calculate force vector
            // if (
            //   Vector.distanceSquared(particle.position, neighbour.position) <
            //     2 &&
            //   particle.size >= neighbour.size
            // ) {
            //   particle.size += neighbour.size;
            //   this.destroy(neighbour);
            // }
          }
        };
      },
      force: (x, y) => {
        return (particle: Particle) => {
          particle.velocity.x += x;
          particle.velocity.y += y;
        };
      },
      limit: (treshold) => {
        return (particle) => {
          particle.velocity.limit(treshold);
        };
      },
      attract: (forceMultiplier = 1, groups = []) => {
        return (particle) => {
          // attract other particles
          const totalForce: Vector = new Vector(0, 0);
          const force: Vector = new Vector(0, 0);
          let i: number = 0;
          const l: number = this.particles.length;
          let distance;
          let pull;
          let attractor;
          const grouping = groups.length;

          for (; i < l; i++) {
            attractor = this.particles[i];

            // can't be attracted by itself or mismatched groups
            if (
              attractor === particle ||
              (grouping && groups.indexOf(attractor.group) === -1)
            ) {
              continue;
            }

            // calculate force vector
            force.x = attractor.position.x - particle.position.x;
            force.y = attractor.position.y - particle.position.y;
            distance = force.magnitude;
            force.normalize();

            // the bigger the attractor the more force
            force.multiply(attractor.size / distance);

            totalForce.add(force);
          }

          totalForce.multiply(forceMultiplier);

          particle.velocity.add(totalForce);
        };
      },
      wrap: (margin) => {
        return (particle) => {
          // move around when particle reaches edge of screen
          const position = particle.position;
          const radius = particle.size * 0.5;

          if (position.x + radius > this.canvas.width + margin) {
            position.x = radius;
          }

          if (position.y + radius > this.canvas.height + margin) {
            position.y = radius;
          }

          if (position.x - radius < -margin) {
            position.x = this.canvas.width - radius;
          }

          if (position.y - radius < -margin) {
            position.y = this.canvas.height - radius;
          }
        };
      },
      reflect: () => {
        return (particle) => {
          // bounce from edges
          const position = particle.position;
          const velocity = particle.velocity;
          const radius = particle.size * 0.5;

          if (position.x + radius > this.canvas.width) {
            velocity.x = -velocity.x;
          }

          if (position.y + radius > this.canvas.height) {
            velocity.y = -velocity.y;
          }

          if (position.x - radius < 0) {
            velocity.x = -velocity.x;
          }

          if (position.y - radius < 0) {
            velocity.y = -velocity.y;
          }
        };
      },
      edge: (action) => {
        return (particle) => {
          const position = particle.position;
          const velocity = particle.velocity;
          const radius = particle.size * 0.5;

          if (position.x + radius > this.canvas.width) {
            action(particle);
          }

          if (position.y + radius > this.canvas.height) {
            action(particle);
          }

          if (position.x - radius < 0) {
            action(particle);
          }

          if (position.y - radius < 0) {
            action(particle);
          }
        };
      },
    };

    // call init method so the scene can be setup
    options.init();

    // start ticking
    this.tick(options);
  }

  // simulation update loop
  private act(options) {
    // update particle states
    let i = 0;
    let l = this.particles.length;
    let p: Particle;
    for (; i < l; i++) {
      this.particles[i].update(this.stage);
    }

    // clean destroyed particles
    while ((p = this.destroyed.pop())) {
      do {
        // has not been found in destroyed array?
        if (p !== this.particles[i]) {
          continue;
        }

        // remove particle
        this.particles.splice(i, 1);
      } while (i-- >= 0);
    }

    // repaint context
    options.beforePaint();

    // repaint particles
    i = 0;
    l = this.particles.length;
    for (; i < l; i++) {
      options.paint(this.particles[i]);
    }

    // after particles have been painted
    options.afterPaint();
  }

  /**
   * API
   **/
  private clear() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private tick(options) {
    // call update method, this allows for inserting particles later on
    options.tick(this.particles);

    // update particles here
    this.act(options);

    // on to the next frame
    window.requestAnimationFrame(() => {
      this.tick(options);
    });
  }

  private destroy(particle: Particle) {
    this.destroyed.push(particle);
  }

  private add(id, group, position, velocity, size, life, behavior) {
    this.particles.push(
      new Particle(id, group, position, velocity, size, life, behavior)
    );
  }

  private spray(amount, config) {
    for (let i = 0; i < amount; i++) {
      const agrs = config();
      this.add(agrs[0], agrs[1], agrs[2], agrs[3], agrs[4], agrs[5], agrs[6]);
    }
  }

  private debug(particle) {
    this.paint.circle(
      particle.position.x,
      particle.position.y,
      particle.size,
      'rgba(255,0,0,.75)'
    );
    this.context.beginPath();
    this.context.moveTo(particle.position.x, particle.position.y);
    this.context.lineTo(
      particle.position.x + particle.velocity.x * 10,
      particle.position.y + particle.velocity.y * 10
    );
    this.context.strokeStyle = 'rgba(255,0,0,.1)';
    this.context.stroke();
    this.context.closePath();
  }
}
