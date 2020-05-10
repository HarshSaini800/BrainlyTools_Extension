import Action from "@/scripts/controllers/Req/Brainly/Action";
import Report from ".";

export default class QuestionReport extends Report {
  RenderDeleteButtons() {
    super.RenderDeleteButtons("question", {
      button: "mustard",
      text: "gray",
    });
  }

  // eslint-disable-next-line class-methods-use-this
  Delete(data) {
    data.take_points = data.give_warning;
    data.return_points = !data.give_warning;

    return new Action().RemoveQuestion(data);
  }
}
