<?php
/**
 * This class contain all methods to check the type of package
 *
 * LICENSE: This source file is subject to the Creative Commons License.
 * It is available through the world-wide-web at this URL:
 * http://creativecommons.org/licenses/by-nc-nd/3.0/nl/deed.en_US
 *
 * If you want to add improvements, please create a fork in our GitHub:
 * https://github.com/myparcelnl/magento
 *
 * @author      Reindert Vetter <reindert@myparcel.nl>
 * @copyright   2010-2017 MyParcel
 * @license     http://creativecommons.org/licenses/by-nc-nd/3.0/nl/deed.en_US  CC BY-NC-ND 3.0 NL
 * @link        https://github.com/myparcelnl/magento
 * @since       File available since Release 2.0.0
 */

namespace MyParcelNL\Magento\Sales;


use Magento\Framework\Module\ModuleListInterface;
use MyParcelNL\Magento\Helper\Data;
use Magento\Framework\App\Helper\Context;
use Psr\Log\LoggerInterface;

class Package extends Data
{
    const PACKAGE_TYPE_NORMAL = 1;
    const PACKAGE_TYPE_MAILBOX = 2;
    const PACKAGE_TYPE_LETTER = 3;

    /**
     * @var int
     */
    private $weight = 0;

    /**
     * @var int
     */
    private $max_mailbox_weight = 0;

    /**
     * @var bool
     */
    private $mailbox_is_active = false;

    /**
     * @var bool
     */
    private $show_mailbox_with_other_options = true;

    /**
     * @var string
     */
    private $title;

    private $current_country = 'NL';

    /**
     * @var int
     */
    private $package_type = null;

    /**
     * Mailbox constructor
     *
     * @param Context $context
     * @param ModuleListInterface $moduleList
     * @param LoggerInterface $logger
     */
    public function __construct(Context $context, ModuleListInterface $moduleList, LoggerInterface $logger)
    {
        parent::__construct($context, $moduleList, $logger);

        $this->setMailboxSettings();
    }

    /**
     * @return int
     */
    public function getWeight(): int
    {
        return $this->weight;
    }

    /**
     * @return $this
     */
    public function setWeight()
    {
        /** @todo; loop all products */

        return $this;
    }

    /**
     * @param int $weight
     */
    public function addWeight(int $weight)
    {
        $this->weight += $weight;
    }

    /**
     * @return bool
     */
    public function mailboxIsActive(): bool
    {
        return $this->mailbox_is_active;
    }

    /**
     * @param bool $mailbox_is_active
     * @return $this
     */
    public function setMailboxIsActive(bool $mailbox_is_active)
    {
        $this->mailbox_is_active = $mailbox_is_active;

        return $this;
    }

    /**
     * @return bool
     */
    public function isShowMailboxWithOtherOptions(): bool
    {
        return $this->show_mailbox_with_other_options;
    }

    /**
     * @param bool $show_mailbox_with_other_options
     * @return $this
     */
    public function setShowMailboxWithOtherOptions(bool $show_mailbox_with_other_options)
    {
        $this->show_mailbox_with_other_options = $show_mailbox_with_other_options;

        return $this;
    }

    /**
     * @return mixed
     */
    public function getTitle()
    {
        return $this->title;
    }

    /**
     * @param mixed $title
     * @return $this
     */
    public function setTitle($title)
    {
        $this->title = $title;

        return $this;
    }

    /**
     * @return int
     */
    public function getMaxWeight(): int
    {
        return $this->max_mailbox_weight;
    }

    /**
     * @param int $max_mailbox_weight
     */
    public function setMaxWeight(int $max_mailbox_weight)
    {
        $this->max_mailbox_weight = $max_mailbox_weight;
    }

    /**
     * package = 1, mailbox = 2, letter = 3
     *
     * @return int
     */
    public function getPackageType(): int
    {
        return $this->package_type;
    }

    /**
     * package = 1, mailbox = 2, letter = 3
     *
     * @param int $package_type
     */
    public function setPackageType(int $package_type)
    {
        $this->package_type = $package_type;
    }

    /**
     * @return string
     */
    public function getCurrentCountry(): string
    {
        return $this->current_country;
    }

    /**
     * @param string $current_country
     * @return Package
     */
    public function setCurrentCountry(string $current_country): Package
    {
        $this->current_country = $current_country;

        return $this;
    }

    /**
     * Init all mailbox settings
     */
    private function setMailboxSettings()
    {
        $settings = $this->getConfigValue(self::XML_PATH_CHECKOUT . 'mailbox');

        if ($settings === null) {
            $this->logger->critical('Can\'t set settings with path:' . self::XML_PATH_CHECKOUT . 'mailbox');
        }

        if (!key_exists('active', $settings)) {
            $this->logger->critical('Can\'t get mailbox setting active');
        }

        $this->setActive($settings['active']);
        if ($this->mailboxIsActive() === true) {
            $this
                ->setTitle($settings['title'])
                ->setShowMailboxWithOtherOptions($settings['show_mailbox_with_other_options'])
                ->setWeight();
        }
    }
}