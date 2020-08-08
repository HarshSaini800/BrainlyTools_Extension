/* eslint-disable no-await-in-loop */
import {
  Button,
  Checkbox,
  Flex,
  Icon,
  Spinner,
  Text,
} from "@root/scripts/components/style-guide";
import Build from "@root/scripts/helpers/Build";
import HideElement from "@root/scripts/helpers/HideElement";
import IsVisible from "@root/scripts/helpers/IsVisible";
import WaitForElement from "@root/scripts/helpers/WaitForElement";
import sortablejs from "sortablejs";
import notification from "../../../components/notification2";
import Progress from "../../../components/Progress";
import Action from "../../../controllers/Req/Brainly/Action";
import RemoveJunkNotifications from "../../0-Core/_/RemoveJunkNotifications";

class RankManager {
  /**
   * @typedef {{
   *  id?: number,
   *  name?: string,
   *  description?: string,
   * }} RankType
   *
   * @param {*} user
   */
  constructor(user) {
    this.user = user;
    /**
     * @type {{
     *  data: RankType,
     *  checkbox: HTMLInputElement,
     *  rankContainer: HTMLLabelElement,
     * }[]}
     */
    this.ranks = [];

    this.FindTheDeleteRanksForm();
  }

  async FindTheDeleteRanksForm() {
    this.deleteAllRanksForm = await WaitForElement(
      `[action="/ranks/delete_user_special_ranks"]`,
      {
        noError: true,
      },
    );
    this.deleteAllRanksLi = $(this.deleteAllRanksForm).parent();

    this.Init();
  }

  Init() {
    this.RenderLink();
    this.RenderPanel();
    this.RenderProgressBar();
    this.RenderSpinner();
    this.RenderRanks();
    this.BindHandlers();
    this.UpdateInputTitle();
  }

  RenderLink() {
    this.$manageLi = $(`<li></li>`);
    this.$manageLink = $(
      `<a href="#"><font color="red">${System.constants.config.reasonSign}</font> ${System.data.locale.userProfile.rankManager.title}</a>`,
    );

    this.$manageLink.appendTo(this.$manageLi);
    this.$manageLi.insertBefore(this.deleteAllRanksLi);
  }

  RenderPanel() {
    this.container = Build(Flex({ direction: "column" }), [
      [
        Flex({ marginTop: "s", marginBottom: "s" }),
        Text({
          weight: "bold",
          html: System.data.locale.userProfile.rankManager.title,
        }),
      ],
      (this.rankContainer = Flex({ direction: "column" })),
      [
        Flex({
          marginTop: "s",
          marginBottom: "s",
        }),
        (this.saveButton = new Button({
          size: "s",
          fullWidth: true,
          type: "solid-mint",
          text: System.data.locale.common.save,
        })),
      ],
    ]);
  }

  RenderProgressBar() {
    this.progress = new Progress({
      type: "success",
      label: "",
      max: 2,
      fullWidth: true,
    });
    this.progressContainer = Flex({
      marginBottom: "s",
      children: this.progress.$container[0],
    });
  }

  RenderSpinner() {
    this.spinner = Spinner({ overlay: true });
  }

  RenderRanks() {
    /**
     * @type {{ranks: RankType[]}}
     */
    let { ranks } = System.data.Brainly.defaultConfig.config.data;
    ranks = ranks.sort((a, b) => {
      return (
        this.user.ranks_ids.indexOf(b.id) - this.user.ranks_ids.indexOf(a.id)
      );
    });
    ranks = ranks.sort(a => (this.user.ranks_ids.includes(a.id) ? -1 : 1));

    ranks.forEach(
      /**
       * @param {RankType} rank
       */
      (rank, i) => {
        if (!rank || rank.type !== 5) return;

        const userHasRank = this.user.ranks_ids.includes(rank.id);
        const checkbox = Checkbox({
          id: `p-${rank.id}`,
          checked: userHasRank,
        });

        const rankContainer = Build(
          Flex({
            wrap: false,
            tag: "label",
            marginBottom:
              i + 1 !==
              System.data.Brainly.defaultConfig.config.data.ranks.length
                ? "xs"
                : "",
          }),
          [
            [
              Flex({ margin: "xxs", fullWidth: true }),
              [
                [Flex({ marginRight: "xs", alignItems: "center" }), checkbox],
                [
                  Flex({
                    direction:
                      rank.description && rank.name !== rank.description
                        ? "column"
                        : "",
                    alignItems:
                      rank.description && rank.name !== rank.description
                        ? "flex-start"
                        : "center",
                    fullWidth: true,
                  }),
                  [
                    [
                      Flex(),
                      Text({
                        html: rank.name,
                        weight: "bold",
                        color: "blue-dark",
                        href: `/admin/ranks/edit/${rank.id}`,
                        size: "xsmall",
                        title: rank.description,
                        target: "_blank",
                        /* style: {
                    color: `#${rank.color}`
                  } */
                      }),
                    ],
                    rank.description &&
                      rank.name !== rank.description && [
                        Flex({ fullWidth: true, direction: "column" }),
                        Text({
                          tag: "i",
                          size: "xsmall",
                          color: "gray",
                          html: rank.description,
                        }),
                      ],
                  ],
                ],
                [
                  Flex({ alignItems: "center" }),
                  new Button({
                    iconOnly: true,
                    size: "xs",
                    className: "dragger",
                    type: "transparent-blue",
                    icon: new Icon({
                      type: "menu",
                      color: "blue",
                      size: 14,
                    }),
                  }),
                ],
              ],
            ],
          ],
        );

        this.ranks.push({
          data: rank,
          checkbox: checkbox.firstElementChild,
          rankContainer,
        });
        this.rankContainer.append(rankContainer);
      },
    );

    // eslint-disable-next-line no-new, new-cap
    new sortablejs(this.rankContainer, {
      animation: 200,
      multiDrag: true,
      handle: ".dragger",
      fallbackTolerance: 3,
      selectedClass: "sg-box--blue-secondary-light",
    });
  }

  BindHandlers() {
    this.$manageLink.click(e => {
      e.preventDefault();
      this.TogglePanel();
    });
    this.saveButton.element.addEventListener(
      "click",
      this.SaveSelectedRank.bind(this),
    );
    const rankLinks = this.rankContainer.querySelectorAll("a");

    if (rankLinks && rankLinks.length > 0)
      rankLinks.forEach(rankLink =>
        rankLink.addEventListener("click", event => {
          if (event.ctrlKey) return;

          event.preventDefault();
          rankLink.parentNode.click();
        }),
      );
  }

  TogglePanel() {
    if (IsVisible(this.container)) {
      this.ClosePanel();
    } else {
      this.OpenPanel();
    }
  }

  ClosePanel() {
    HideElement(this.container);
    this.progress.forceClose(true);
  }

  OpenPanel() {
    this.$manageLi.append(this.container);
  }

  async SaveSelectedRank() {
    let selectedRanks = this.ranks.filter(rank => rank.checkbox.checked);

    const getElementIndex = element => {
      return Array.from(element.parentNode.children).indexOf(element);
    };
    selectedRanks = selectedRanks.sort((a, b) => {
      return getElementIndex(a.rankContainer) > getElementIndex(b.rankContainer)
        ? 1
        : -1;
    });

    const tokens = {
      key: $(`input[name="data[_Token][key]"]`, this.deleteAllRanksLi).val(),
      fields: $(
        `input[name="data[_Token][fields]"]`,
        this.deleteAllRanksLi,
      ).val(),
      lock: $(`input[name="data[_Token][lock]"]`, this.deleteAllRanksLi).val(),
    };

    this.ShowSpinner();

    if (!confirm(System.data.locale.common.notificationMessages.areYouSure))
      return;

    this.ShowProgressContainer();
    this.progress.setMax(2);
    this.progress.update(0);
    this.progress.ChangeType("loading");
    this.progress.UpdateLabel(
      System.data.locale.userProfile.rankManager.removingAllSpecialRanks,
    );

    await System.Delay(50);

    const removeAllRanksXHR = await new Action().RemoveAllRanks(
      window.profileData.id,
      tokens,
    );
    const redirectedUserID = System.ExtractId(removeAllRanksXHR.url);

    RemoveJunkNotifications();

    if (redirectedUserID !== profileData.id) {
      notification({
        html:
          System.data.locale.common.notificationMessages
            .somethingWentWrongPleaseRefresh,
        type: "error",
      });

      return;
    }
    let currentProgress = 0;

    this.progress.update(++currentProgress);
    this.progress.UpdateLabel(
      System.data.locale.userProfile.rankManager.allRanksRemoved,
    );
    await System.Delay(500);

    this.progress.update(++currentProgress);

    if (selectedRanks.length === 0) {
      this.SavingCompleted();

      return;
    }

    this.progress.setMax(selectedRanks.length + 3);
    this.progress.UpdateLabel(
      System.data.locale.userProfile.rankManager.updatingRanks,
    );
    await System.Delay(500);

    // eslint-disable-next-line no-restricted-syntax
    for (const selectedRank of selectedRanks) {
      await new Action().AddRank(window.profileData.id, selectedRank.data.id);
      // await System.Delay(500);

      this.progress.update(++currentProgress);
      this.progress.UpdateLabel(
        System.data.locale.userProfile.rankManager.xHasAssigned.replace(
          "%{rank_name}",
          ` ${selectedRank.data.name} `,
        ),
      );
    }

    await System.Delay(500);

    RemoveJunkNotifications();
    this.progress.update(++currentProgress);
    this.SavingCompleted();
  }

  ShowProgressContainer() {
    this.container.append(this.progressContainer);
  }

  SavingCompleted() {
    this.HideSpinner();
    this.progress.ChangeType("success");
    this.progress.UpdateLabel(System.data.locale.common.allDone);
  }

  ShowSpinner() {
    this.saveButton.Disable();
    this.saveButton.element.append(this.spinner);
  }

  HideSpinner() {
    this.saveButton.Enable();
    HideElement(this.spinner);
  }

  UpdateInputTitle() {
    const formTitle = $(`input[type="submit"]`, this.deleteAllRanksForm);

    formTitle.val(System.data.locale.userProfile.rankManager.removeAllRanks);
  }
}

export default RankManager;
