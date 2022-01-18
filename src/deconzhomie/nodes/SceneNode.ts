import { HomieNode, HomieProperty, HomieDevice } from "node-homie";
import { HomieNodeAtrributes, HOMIE_TYPE_ENUM} from "node-homie/model";
import { H_SMARTHOME_TYPE_EXTENSTION } from "hc-node-homie-smarthome/model";

export const H_SMARTHOME_TYPE_EXT_LIGHTSCENE = `${H_SMARTHOME_TYPE_EXTENSTION}=lightscene`;

export interface LightSceneNodePropertyConfig {
    scenes: string[];
}

 export class LightSceneNode extends HomieNode {
    public readonly propConfig: LightSceneNodePropertyConfig;

    public readonly propRecall: HomieProperty;

    public set recall(value: string) {
        if (this.propConfig.scenes.includes(value as any)) {
            this.propRecall.value = value;
        }
    }

    constructor(device: HomieDevice, attrs: Partial<HomieNodeAtrributes> = {}, propConfig: LightSceneNodePropertyConfig = { scenes: [] }) {
        super(device, {
            ...{
                id: 'scenes',
                name: 'Scenes',
                type: H_SMARTHOME_TYPE_EXT_LIGHTSCENE
            },
            ...attrs
        });
        this.propConfig = propConfig;

        this.propRecall = this.add(new HomieProperty(this, {
            id: 'recall',
            name: 'Recall a scene',
            datatype: HOMIE_TYPE_ENUM,
            retained: false,
            settable: true,
            format: this.propConfig.scenes.join(',')
        }));



    }
}