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

const ProtobufConverter = require('./protobufconverter');
const glob = require('glob');

/**
 * Convert Google Protobuf definitions to Composer concepts
 */
class ProtobufBatchConverter {

    /**
     * Converts a set of protobuf files into a set of
     * Composer models that are generated in an output directory.
     * @param {String} inputDir - the input directory
     * @param {String} outputDir - the output directory for the generated Composer models
     */
    static convert(inputDir, outputDir) {

        const protobufFiles = glob.sync( inputDir + '/**/*.proto');
        console.log('Found ' + protobufFiles.length + ' proto files under ' + inputDir);

        for (let n = 0; n < protobufFiles.length; n++) {
            ProtobufConverter.convert(protobufFiles[n], outputDir);
        }
    }
}

module.exports = ProtobufBatchConverter;
