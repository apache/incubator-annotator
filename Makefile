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

# Determine the version identifier from lerna.json or git.

# Are we in a release?
in_release = $(shell if [ ! -d .git ]; then echo true; fi)

ifeq ($(in_release), true)

# Get the version information from lerna.json.
annotator_vsn = $(shell jq -r .version < lerna.json)

else

# Get the version information from git.

# What is the prerelease version?
vsn_pre = $(shell git describe --tags --always --first-parent \
        | grep -Eo -- '(-rc\.[0-9]+)?$$' \
        2>/dev/null)

# What is the release version?
vsn_rel = $(shell git describe --tags --always --first-parent \
        | grep -Eo -- '^v[0-9]+\.[0-9]\.[0-9]+' \
        | tail -c +2 \
        2>/dev/null)

# Is this a tagged release?
vsn_tag = $(shell git describe --tags --always --first-parent \
        | grep -Eo -- '^v[0-9]+\.[0-9]\.[0-9]+(-rc.[0-9]+)?$$' \
        | tail -c +2 \
        2>/dev/null)

annotator_vsn = $(vsn_rel)

endif


.PHONY: all
all: build

.PHONY: build
build:
	@yarn

.PHONY: clean
clean:
	@yarn run clean

.PHONY: check
check:
	@yarn test

ifeq ($(vsn_tag),)

.PHONY: dist
dist distcheck:
	$(error No tag found for release)

else

.PHONY: dist
dist:
	@rm -rf apache-annotator-$(annotator_vsn)$(vsn_pre)-incubating
	@git archive \
        --output apache-annotator-$(annotator_vsn)$(vsn_pre)-incubating.tar.gz \
        --prefix apache-annotator-$(annotator_vsn)-incubating/ \
        HEAD
	@gpg -ab apache-annotator-$(annotator_vsn)$(vsn_pre)-incubating.tar.gz
	@sha256sum apache-annotator-$(annotator_vsn)$(vsn_pre)-incubating.tar.gz \
        > apache-annotator-$(annotator_vsn)$(vsn_pre)-incubating.tar.gz.sha256
	@sha512sum apache-annotator-$(annotator_vsn)$(vsn_pre)-incubating.tar.gz \
        > apache-annotator-$(annotator_vsn)$(vsn_pre)-incubating.tar.gz.sha512
	@echo "Done: apache-annotator-$(annotator_vsn)$(vsn_pre)-incubating.tar.gz"

.PHONY: distcheck
distcheck: dist
	@tar xzf apache-annotator-$(annotator_vsn)$(vsn_pre)-incubating.tar.gz
	@make -C apache-annotator-$(annotator_vsn)-incubating check

endif
