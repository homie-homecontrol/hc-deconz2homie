import { GroupResource, isGroupResource, LightResource } from "../deconz/deconz.model";

export interface Group {
    resource: GroupResource
    lightBrightness: {
        [id: string]: number
    }
}

export function isGroup(obj: any): obj is Group {
    return !!obj && !!obj.resource && isGroupResource(obj.resource) && !!obj.lightBrightness;
}

export function createGroup(resource: GroupResource, lights: { [id: string]: LightResource }): Group {
    const lightBrightness: {
        [id: string]: number
    } = {};
    resource.lights.forEach(id => {
        const light = lights[id];
        if (light) {
            lightBrightness[id] = light.state?.bri
        }
    })

    return { resource, lightBrightness };
}