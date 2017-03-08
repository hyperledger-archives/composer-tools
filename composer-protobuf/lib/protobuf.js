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

const program = require('commander');
const ProtobufConverter = require('./protobufconverter');

/**
 * Convert Google Protobuf definitions to Composer concepts
 *
 * node ./lib/codegen/protobuf.js -i ./protoDir -o ./outputDir
 */
program
    .version('1.0')
    .description('convert Google protobuf files to Composer CTO files')
    .option('-i, --inputDir <inputDir>', 'Input directory')
    .option('-o, --outputDir <outputDir>', 'Output directory')
    .parse(process.argv);

if (!program.args || !program.args.length) {
    program.help();
}

const converter = new ProtobufConverter();
converter.convert(program.inputDir, program.outputDir);
