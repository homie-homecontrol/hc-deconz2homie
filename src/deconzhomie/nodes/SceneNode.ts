import { HomieNode, HomieProperty, HomieDevice } from "node-homie";
import { HomieNodeAtrributes, HOMIE_TYPE_ENUM} from "node-homie/model";
import { BaseNodePropertyConfig, H_SMARTHOME_TYPE_EXTENSTION } from "hc-node-homie-smarthome/model";
import { BaseSmarthomeNode } from "hc-node-homie-smarthome";

export const H_SMARTHOME_TYPE_EXT_LIGHTSCENE = `${H_SMARTHOME_TYPE_EXTENSTION}=lightscene`;

export const H_SMARTHOME_TYPE_EXT_LIGHTSCENE_PROPS = ['recall'] as const;
export type SmarthomeTypeLightSceneProps = typeof H_SMARTHOME_TYPE_EXT_LIGHTSCENE_PROPS[number];

export interface LightSceneNodePropertyConfig extends BaseNodePropertyConfig<SmarthomeTypeLightSceneProps> {
    scenes: string[];
}

 export class LightSceneNode extends BaseSmarthomeNode<LightSceneNodePropertyConfig> {
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
        }, propConfig);

        this.propRecall = this.makeProperty({
            id: 'recall',
            name: 'Recall a scene',
            datatype: HOMIE_TYPE_ENUM,
            retained: false,
            settable: true,
            format: this.propConfig.scenes.join(',')
        });



    }
}