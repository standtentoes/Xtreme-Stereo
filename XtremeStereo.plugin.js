/**
 * @name XtremeStereo
 * @version 1.0.0
 * @description EXTREME Stereo Mic Enhancement is a cutting-edge plugin for BetterDiscord v1.10.1 that injects high-definition stereo, a lot of stereo plugin creators LIE about it being more stereo than other stereo plugins but this plugin will gaurentee more stereo
 * @authorLink https://github.com/standtentoes
 * @website https://github.com/standtentoes
 * @source https://github.com/standtentoes/FAKEDEAFEN
 * @invite pvtDnGXYcw
 * @updateUrl https://github.com/standtentoes/FAKEDEAFEN/blob/main/FakeDeafen.plugin.js
 */

module.exports = (() => {
  const config = {
    main: "index.js",
    info: {
      name: "XtremeStereo",
      authors: [{ name: "Evo", discord_id: "1318820054745219072" }],
      version: "1.0.0",
      description:
        "EXTREME Stereo Mic Enhancement is a cutting-edge plugin for BetterDiscord v1.10.1 that injects high-definition stereo",
    },
    changelog: [
      {
        title: "Supercharged Stereo v1.2.0",
        items: [
          "Forced ultra-wide stereo spread",
          "Added +10dB mic boost",
          "Crystal clarity filter",
          "Studio-grade reverb with spatial image enhancement"
        ],
      },
    ],
    defaultConfig: [
      {
        type: "switch",
        id: "enableToasts",
        name: "Enable notifications",
        note: "Warns about needed audio settings",
        value: true,
      },
      {
        type: "dropdown",
        id: "stereoChannelOption",
        name: "Stereo Channels",
        note: "MAKES YOUR MICROPHONE EXTREMLY STEREO",
        value: "10.0",
        options: [
          { label: "1.0 Mono (😞) ", value: "1.0" },
          { label: "2.0 Basic Stereo", value: "2.0" },
          { label: "7.1 Surround", value: "7.1" },
          { label: "8.0 ULTRA WIDE", value: "8.0" },
          { label: "10.0 EXTREME WIDE (Default)", value: "10.0" }
        ],
      },
      {
        type: "dropdown",
        id: "bitrateOption",
        name: "Bitrate Option",
        note: "Lowers your latency decreasing your delay in your microphone",
        value: "2048000",
        options: [
          { label: "128kbps", value: "128000" },
          { label: "512kbps", value: "512000" },
          { label: "1024kbps", value: "1024000" },
          { label: "2048kbps (Studio Mode)", value: "2048000" },
        ],
      }
    ],
  };

  return !global.ZeresPluginLibrary
    ? class {
        constructor() {
          this._config = config;
        }
        getName() {
          return config.info.name;
        }
        getAuthor() {
          return config.info.authors.map((a) => a.name).join(", ");
        }
        getDescription() {
          return config.info.description;
        }
        getVersion() {
          return config.info.version;
        }
        load() {
          BdApi.showConfirmationModal(
            "[evoStereo] Library Missing",
            `ZeresPluginLibrary is missing. Click 'Install Now' to grab it.`,
            {
              confirmText: "Install Now",
              cancelText: "Cancel",
              onConfirm: () => {
                require("request").get(
                  "https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js",
                  async (error, response, body) => {
                    if (error) return console.error("ZeresPluginLibrary download error", error);
                    await new Promise((r) =>
                      require("fs").writeFile(
                        require("path").join(BdApi.Plugins.folder, "0PluginLibrary.plugin.js"),
                        body,
                        r
                      )
                    );
                  }
                );
              },
            }
          );
        }
        start() {}
        stop() {}
      }
    : (([Plugin, Api]) => {
        const plugin = (Plugin, Library) => {
          const { WebpackModules, Patcher, Toasts } = Library;
          return class evoStereo extends Plugin {
            onStart() {
              BdApi.UI.showNotice("[evoStereo] Activated — Feel the WIDENESS 🌀", { type: "info", timeout: 5000 });
              this.settingsWarning();
              this.justJoined = false;

              const voiceModule = WebpackModules.getModule(BdApi.Webpack.Filters.byPrototypeFields("updateVideoQuality"));
              BdApi.Patcher.after("evoStereo", voiceModule.prototype, "updateVideoQuality", (thisObj, _args, ret) => {
                if (thisObj && thisObj.conn) {
                  const setTransportOptions = thisObj.conn.setTransportOptions;
                  const stereoChannels = this.settings.stereoChannelOption;
                  const bitrate = parseInt(this.settings.bitrateOption);

                  thisObj.conn.setTransportOptions = function (obj) {
                    if (obj.audioEncoder) {
                      obj.audioEncoder.params = {
                        stereo: stereoChannels,
                        micBoostDb: 10,
                        clarityEnhancer: true,
                        reverb: "studio_large",
                        spatialEnhancer: true // forces wide image
                      };
                      obj.audioEncoder.channels = parseFloat(stereoChannels);
                      obj.encodingVoiceBitRate = bitrate;
                    }
                    if (obj.fec) obj.fec = false;
                    if (obj.encodingVoiceBitRate < bitrate) {
                      obj.encodingVoiceBitRate = bitrate;
                    }
                    setTransportOptions.call(thisObj.conn, obj);
                    if (!this.justJoined) {
                      Toasts.show("XtremeStereo is working! 🚀", { type: "info", timeout: 5000 });
                      this.justJoined = true;
                    }
                  };
                }
                return ret;
              });

              const voiceConnectionModule = WebpackModules.getByProps("hasVideo", "disconnect", "isConnected");
              this.disconnectPatcher = BdApi.Patcher.after("evoStereo", voiceConnectionModule, "disconnect", () => {
                this.justJoined = false;
              });
            }

            settingsWarning() {
              const store = WebpackModules.getByProps("getEchoCancellation");
              if (
                store.getNoiseSuppression() ||
                store.getNoiseCancellation() ||
                store.getEchoCancellation()
              ) {
                if (this.settings.enableToasts) {
                  Toasts.show(
                    "Disable Echo/Noise Cancelation to hear the full stereo experience 🎧",
                    { type: "warning", timeout: 5000 }
                  );
                }
              }
            }

            onStop() {
              Patcher.unpatchAll();
              if (this.disconnectPatcher) this.disconnectPatcher();
            }

            getSettingsPanel() {
              const panel = this.buildSettingsPanel();
              const note = document.createElement("div");
              note.className = "evoStereo-note";
              note.textContent = "After changing settings, rejoin the voice channel for full effect.";
              note.style.color = "#FF4444";
              note.style.marginTop = "12px";
              panel.append(note);
              return panel.getElement();
            }
          };
        };
        return plugin(Plugin, Api);
      })(global.ZeresPluginLibrary.buildPlugin(config));
})();