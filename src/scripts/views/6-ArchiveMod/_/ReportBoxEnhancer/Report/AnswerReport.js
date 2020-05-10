import Action from "@/scripts/controllers/Req/Brainly/Action";
import Report from ".";

export default class AnswerReport extends Report {
  RenderDeleteButtons() {
    super.RenderDeleteButtons("answer", {
      button: "peach",
      text: "white",
    });
  }

  // eslint-disable-next-line class-methods-use-this
  Delete(data) {
    data.take_points = data.give_warning;

    return new Action().RemoveAnswer(data, true);
  }
}
