import { _decorator, AnimationClip, Component, animation, Vec2, Animation } from "cc";
const { ccclass, property } = _decorator;

interface TrackConstructor<T extends Track> {
  new (): T;
}

type Track = animation.RealTrack | animation.VectorTrack | animation.ColorTrack | animation.QuatTrack | animation.SizeTrack;

@ccclass("BoxAnimation")
export class BoxAnimation extends Component {
  private clips: Set<AnimationClip["name"]> = new Set();

  protected start(): void {}

  protected onLoad(): void {}

  protected update(deltaTime: number): void {}

  public createBaseAnimation<T extends Track>(
    clipName: string,
    Track: TrackConstructor<T>,
    options: {
      duration: AnimationClip["duration"];
      wrapMode: AnimationClip["wrapMode"];
      keys: AnimationClip["keys"];
    },
  ): { track: T; clip: AnimationClip } {
    const animationClip = new AnimationClip(clipName);
    const track = new Track();

    animationClip.duration = options.duration;
    animationClip.wrapMode = options.wrapMode;
    animationClip.keys = options.keys;
    return {
      track,
      clip: animationClip,
    };
  }

  public createScaleAnimation<T extends animation.VectorTrack>(vectorTrack: T, clip: AnimationClip, keyFrameState: Vec2[]): AnimationClip {
    vectorTrack.path = new animation.TrackPath().toProperty("scale");
    const [x, y] = vectorTrack.channels();

    const vec2KeyFrames: [number, Vec2][] = clip.keys[0].map((key, i) => [key, keyFrameState[i]]);

    x.curve.assignSorted(vec2KeyFrames.map(([time, vec2]) => [time, { value: vec2.x }]));
    y.curve.assignSorted(vec2KeyFrames.map(([time, vec2]) => [time, { value: vec2.y }]));

    clip.addTrack(vectorTrack);

    return clip;
  }

  public addAnimationClip(clip: AnimationClip) {
    let animationComponent = this.node.getComponent(Animation);
    if (!animationComponent) {
      animationComponent = this.node.addComponent(Animation);
    }

    if (this.clips.has(clip.name)) {
      console.error(`Clip with ${clip.name} name already existing!`);
      return;
    }

    animationComponent.addClip(clip, clip.name);
    this.clips.add(clip.name);
  }

  public getAnimation(): Animation {
    return this.node.getComponent(Animation);
  }
}
