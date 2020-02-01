# Licensed under the Apache License, Version 2.0 (the "License"); you may not
# use this file except in compliance with the License. You may obtain a copy of
# the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
# WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
# License for the specific language governing permissions and limitations under
# the License.

ANNOTATOR_VERSION := $(shell jq -r .version < lerna.json)

.PHONY: all
all: build

.PHONY: build
build:
	@yarn

.PHONY: clean
clean:
	@yarn run clean

.PHONY: dist
dist:
	@rm -rf apache-annotator-$(ANNOTATOR_VERSION)
	@git archive \
		--output apache-annotator-$(ANNOTATOR_VERSION).tar.gz \
		--prefix apache-annotator-$(ANNOTATOR_VERSION)/ \
		HEAD
	@gpg -ab apache-annotator-$(ANNOTATOR_VERSION).tar.gz
	@sha256sum apache-annotator-$(ANNOTATOR_VERSION).tar.gz \
	  > apache-annotator-$(ANNOTATOR_VERSION).tar.gz.sha256
	@sha512sum apache-annotator-$(ANNOTATOR_VERSION).tar.gz \
	  > apache-annotator-$(ANNOTATOR_VERSION).tar.gz.sha512
	@echo "Done: apache-annotator-$(ANNOTATOR_VERSION).tar.gz"
