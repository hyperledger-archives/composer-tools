/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const protobuf = require('protobufjs');
const FileWriter = require('composer-common').FileWriter;
const path = require('path');

/**
 * Convert Google Protobuf definitions to Composer concepts
 */
class ProtobufConverter {

    /**
     * Converts a single protobuf file into a
     * Composer model, generated in an output directory.
     * @param {String} protoFile - the name of the  proto file
     * @param {String} outputDir - the output directory for the generated Composer models
     * @returns {String} the path to the generated file
     */
    static convert(protoFile, outputDir) {
        console.log('Parsing: ' + protoFile);

        const root = new protobuf.Root();
        root.loadSync(protoFile);
        //console.log(JSON.stringify(root));
        const writer = new FileWriter(outputDir);
        const outputFile = path.parse(protoFile).name + '.cto';
        writer.openFile(outputFile);
        const ns = ProtobufConverter.convertItem(writer, root, 0);
        writer.writeBeforeLine(0, 'namespace ' + ns.substring(1)); // discard the leading .
        writer.closeFile();
        console.log('Generated: ' + outputFile);
        return outputDir + '/' + outputFile;
    }

    /**
     * Process this protobuf object recursively, writing the CTO to the FileWriter
     * @param {FileWriter} writer - the FileWriter to use
     * @param {ReflectionObject} obj - the object
     * @param {Integer} indent - the indentation to use
     * @returns {String} the namespace to use
     * @private
     */
    static convertItem(writer, obj, indent) {

        let ns = '.unknown';

        // we assume anything with a field is a concept
        if (obj.fieldsArray) {
            writer.writeLine(indent, 'concept ' + obj.name + '{');

            for (let n = 0; n < obj.fieldsArray.length; n++) {
                const field = obj.fieldsArray[n];

                let optional = '';
                let array = '';
                const type = ProtobufConverter.toComposerType(field.type);

                if (field.repeated) {
                    array = '[]';
                }

                if (field.optional) {
                    optional = 'optional';
                }

                const hasDefault = ['String', 'DateTime', 'Integer', 'Double', 'Long', 'Boolean'];
                let def = '';
                if(field.options && !field.repeated && field.options.default && hasDefault.indexOf(type) >= 0) {
                    def = 'default=';
                    if(type === 'String' || type === 'DateTime') {
                        def += '"';
                    }
                    def += field.options.default;

                    if(type === 'String' || type === 'DateTime') {
                        def += '"';
                    }
                }

                writer.writeLine(indent + 1, '  o ' + type +
                    array + ' ' + ProtobufConverter.unqualify(field.name) + ' ' + def + ' ' + optional);
            }

            writer.writeLine(indent, '}');
        }
        // we assume anything with value is an enum
        else if (obj.values) {
            writer.writeLine(indent, 'enum ' + obj.name + '{');

            for (let n = 0; n < Object.keys(obj.values).length; n++) {
                writer.writeLine(indent + 1, '  o ' + Object.keys(obj.values)[n]);
            }

            writer.writeLine(indent, '}');
        }
        // if it has a name and no fields or values, we assume it is a namespace
        else if (obj.fullName) {
            ns = obj.fullName;
        }

        // we then recurse on any nested elements
        if (obj.nestedArray) {
            for (let n = 0; n < obj.nestedArray.length; n++) {
                const childNs = ProtobufConverter.convertItem(writer, obj.nestedArray[n], indent);
                if(childNs !== '.unknown') {
                    ns = childNs;
                }
            }
        }

        return ns;
    }

    /**
     * Converts a Protobuf type to a Composer type
     * @param {String} protoType - the Protobuf type name
     * @return {String} the Composer type to use
     * @private
     */
    static toComposerType(protoType) {

        let result = ProtobufConverter.unqualify(protoType);

        switch (protoType) {
        case 'string':
        case 'bytes':
            result = 'String';
            break;
        case 'double':
        case 'float':
            result = 'Double';
            break;
        case 'int32':
        case 'uint32':
        case 'sint32':
        case 'fixed32':
        case 'sfixed32':
            result = 'Integer';
            break;
        case 'int64':
        case 'uint64':
        case 'sint64':
        case 'fixed64':
        case 'sfixed64':
            result = 'Long';
            break;
        case 'bool':
            result = 'Boolean';
            break;
        }

        return result;
    }

    /**
     * Discards everthing before the last dot
     * @param {String} name - the Protobuf type name
     * @return {String} the unqualified string
     * @private
     */
    static unqualify(name) {

        let result = name;

        // discard the qualified name for types
        let lastDotIndex = name.lastIndexOf('.');
        if(lastDotIndex >= 0) {
            result = result.substring(lastDotIndex+1);
        }

        return result;
    }
}

module.exports = ProtobufConverter;
